import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { ConfigManager } from './utils/config';
import { ErrorHandler } from './utils/errorHandler';
import { PathValidator } from './utils/pathValidator';
import { ElevenLabsService } from './services/elevenlabs';
import { FileProcessor } from './services/fileProcessor';
import { SRTProcessor } from './services/srtProcessor';
import { UpdateManager } from './services/updateManager';
import { TranscriptionRequest, FileInfo, AppConfig } from './types';

class MainProcess {
  private mainWindow: BrowserWindow | null = null;
  private configManager: ConfigManager;
  private elevenLabsService: ElevenLabsService;
  private fileProcessor: FileProcessor;
  private srtProcessor: SRTProcessor;
  private updateManager: UpdateManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.elevenLabsService = new ElevenLabsService(this.configManager);
    this.fileProcessor = new FileProcessor(this.configManager);
    this.srtProcessor = new SRTProcessor(this.configManager);
    this.updateManager = new UpdateManager();
    
    this.initializeApp();
    this.registerIpcHandlers();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createWindow();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      // Set up update manager with the main window
      this.updateManager.setMainWindow(this.mainWindow!);
      
      // Schedule automatic update check
      this.updateManager.scheduleAutoCheck();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private registerIpcHandlers(): void {
    ipcMain.handle('file:select', (_event) => this.handleFileSelect());
    ipcMain.handle('file:open', (_event, filePath: string) => this.handleFileOpen(filePath));
    ipcMain.handle('file:show-in-folder', (_event, filePath: string) => this.handleShowInFolder(filePath));
    ipcMain.handle('transcription:start', (_event, request: TranscriptionRequest) => this.handleTranscriptionStart(request));
    ipcMain.handle('config:get', (_event) => this.handleGetConfig());
    ipcMain.handle('config:save', (_event, config: Partial<AppConfig>) => this.handleSaveConfig(config));
    
    // Update-related handlers
    ipcMain.handle('update:check', (_event) => this.handleUpdateCheck());
    ipcMain.handle('update:download', (_event) => this.handleUpdateDownload());
    ipcMain.handle('update:install', (_event) => this.handleUpdateInstall());
    ipcMain.handle('update:get-status', (_event) => this.handleGetUpdateStatus());
  }

  private async handleFileSelect(): Promise<FileInfo | null> {
    try {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          {
            name: 'Media Files',
            extensions: ['mp3', 'mp4', 'wav', 'm4a', 'mov', 'avi', 'flv', 'mkv', 'webm']
          }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      
      // Validate file path for security
      if (!PathValidator.isValidFilePath(filePath)) {
        throw new Error('Invalid file path or file location not allowed');
      }
      
      const stats = fs.statSync(filePath);
      
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        type: path.extname(filePath)
      };
    } catch (error) {
      const errorInfo = ErrorHandler.getErrorInfo(error);
      this.sendError(errorInfo.message, errorInfo.troubleshooting);
      return null;
    }
  }

  private async handleFileOpen(filePath: string): Promise<void> {
    try {
      // Validate file path for security
      if (!PathValidator.isValidFilePath(filePath)) {
        throw new Error('Invalid file path or file location not allowed');
      }
      
      await shell.openPath(filePath);
    } catch (error) {
      const errorInfo = ErrorHandler.getErrorInfo(error);
      this.sendError(errorInfo.message, errorInfo.troubleshooting);
    }
  }

  private async handleShowInFolder(filePath: string): Promise<void> {
    try {
      // Validate file path for security
      if (!PathValidator.isValidFilePath(filePath)) {
        throw new Error('Invalid file path or file location not allowed');
      }
      
      // On Linux, try alternative methods if shell.showItemInFolder fails
      if (process.platform === 'linux') {
        const dirPath = path.dirname(filePath);
        
        // Validate directory path as well
        if (!PathValidator.isValidDirectoryPath(dirPath)) {
          throw new Error('Invalid directory path or directory location not allowed');
        }
        
        // Use spawn with error handling
        const tryCommand = (command: string, args: string[]): Promise<boolean> => {
          return new Promise((resolve) => {
            const child = spawn(command, args, { detached: true, stdio: 'ignore' });
            child.on('error', () => resolve(false));
            child.on('spawn', () => {
              child.unref();
              resolve(true);
            });
          });
        };
        
        // Try commands in order of preference
        const success = await tryCommand('xdg-open', [dirPath]) ||
                       await tryCommand('nautilus', [dirPath]) ||
                       await tryCommand('dolphin', [dirPath]) ||
                       await tryCommand('thunar', [dirPath]) ||
                       await tryCommand('pcmanfm', [dirPath]);
        
        if (!success) {
          // Last resort: try Electron's method
          shell.showItemInFolder(filePath);
        }
      } else {
        // Use Electron's built-in method for Windows and macOS
        shell.showItemInFolder(filePath);
      }
    } catch (error) {
      const errorInfo = ErrorHandler.getErrorInfo(error);
      this.sendError(errorInfo.message, errorInfo.troubleshooting);
    }
  }

  private async handleTranscriptionStart(request: TranscriptionRequest): Promise<void> {
    try {
      // Stage 1: File validation
      this.sendProgress({
        stage: 'validation',
        percentage: 10,
        message: 'Validating file...'
      });

      const isValid = await this.fileProcessor.validateFile(request.filePath);
      if (!isValid) {
        throw new Error('Invalid file format or file is corrupted');
      }

      // Stage 2: Upload to ElevenLabs
      this.sendProgress({
        stage: 'upload',
        percentage: 30,
        message: 'Uploading file to ElevenLabs...'
      });

      const transcriptionResult = await this.elevenLabsService.transcribeFile(
        request.filePath
      );

      // Stage 3: Processing transcription
      this.sendProgress({
        stage: 'processing',
        percentage: 70,
        message: 'Processing transcription...'
      });

      // Stage 4: Generate SRT with timing adjustment
      this.sendProgress({
        stage: 'srt-generation',
        percentage: 90,
        message: 'Generating SRT file...'
      });

      const srtPath = await this.srtProcessor.processSRT(
        transcriptionResult,
        request.filePath,
        request.characterLimit
      );

      // Stage 5: Complete
      this.sendProgress({
        stage: 'complete',
        percentage: 100,
        message: 'Transcription completed successfully!'
      });

      this.sendComplete({
        success: true,
        srtPath
      });

    } catch (error) {
      const errorInfo = ErrorHandler.getErrorInfo(error);
      this.sendError(errorInfo.message, errorInfo.troubleshooting);
    }
  }

  private async handleGetConfig(): Promise<AppConfig> {
    return this.configManager.getConfig();
  }

  private async handleSaveConfig(config: Partial<AppConfig>): Promise<void> {
    console.log('Main process handleSaveConfig called with:', config);
    try {
      this.configManager.saveConfig(config);
      console.log('Config saved successfully in main process');
    } catch (error) {
      console.error('Error in main process handleSaveConfig:', error);
      throw error;
    }
  }

  private sendProgress(progress: any): void {
    this.mainWindow?.webContents.send('transcription:progress', progress);
  }

  private sendComplete(response: any): void {
    this.mainWindow?.webContents.send('transcription:complete', response);
  }

  private sendError(message: string, troubleshooting?: string): void {
    this.mainWindow?.webContents.send('transcription:error', message, troubleshooting);
  }

  // Update-related handlers
  private async handleUpdateCheck(): Promise<void> {
    await this.updateManager.checkForUpdates();
  }

  private async handleUpdateDownload(): Promise<void> {
    await this.updateManager.downloadUpdate();
  }

  private handleUpdateInstall(): void {
    this.updateManager.quitAndInstall();
  }

  private handleGetUpdateStatus(): any {
    return this.updateManager.getUpdateStatus();
  }
}

new MainProcess();