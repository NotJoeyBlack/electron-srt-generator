import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { ConfigManager } from './utils/config';
import { ErrorHandler } from './utils/errorHandler';
import { ElevenLabsService } from './services/elevenlabs';
import { FileProcessor } from './services/fileProcessor';
import { SRTProcessor } from './services/srtProcessor';
import { TranscriptionRequest, FileInfo, AppConfig } from './types';

class MainProcess {
  private mainWindow: BrowserWindow | null = null;
  private configManager: ConfigManager;
  private elevenLabsService: ElevenLabsService;
  private fileProcessor: FileProcessor;
  private srtProcessor: SRTProcessor;

  constructor() {
    this.configManager = new ConfigManager();
    this.elevenLabsService = new ElevenLabsService(this.configManager);
    this.fileProcessor = new FileProcessor(this.configManager);
    this.srtProcessor = new SRTProcessor(this.configManager);
    
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
  }

  private async handleFileSelect(): Promise<FileInfo | null> {
    console.log('Main: handleFileSelect called');
    try {
      console.log('Main: Opening dialog...');
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          {
            name: 'Media Files',
            extensions: ['mp3', 'mp4', 'wav', 'm4a', 'mov', 'avi', 'flv', 'mkv', 'webm']
          }
        ]
      });

      console.log('Main: Dialog result:', result);

      if (result.canceled || result.filePaths.length === 0) {
        console.log('Main: Dialog canceled or no file selected');
        return null;
      }

      const filePath = result.filePaths[0];
      console.log('Main: Selected file path:', filePath);
      const stats = fs.statSync(filePath);
      
      const fileInfo = {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        type: path.extname(filePath)
      };
      
      console.log('Main: Returning file info:', fileInfo);
      return fileInfo;
    } catch (error) {
      console.error('Main: Error in handleFileSelect:', error);
      const errorInfo = ErrorHandler.getErrorInfo(error);
      this.sendError(errorInfo.message, errorInfo.troubleshooting);
      return null;
    }
  }

  private async handleFileOpen(filePath: string): Promise<void> {
    try {
      await shell.openPath(filePath);
    } catch (error) {
      const errorInfo = ErrorHandler.getErrorInfo(error);
      this.sendError(errorInfo.message, errorInfo.troubleshooting);
    }
  }

  private async handleShowInFolder(filePath: string): Promise<void> {
    try {
      console.log('Main: handleShowInFolder called with:', filePath);
      
      // On Linux, try alternative methods if shell.showItemInFolder fails
      if (process.platform === 'linux') {
        const dirPath = path.dirname(filePath);
        
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
        } else {
          console.log('Main: Successfully opened folder on Linux');
        }
      } else {
        // Use Electron's built-in method for Windows and macOS
        shell.showItemInFolder(filePath);
      }
    } catch (error) {
      console.error('Main: Error in handleShowInFolder:', error);
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
        request.filePath,
        request.characterLimit
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
        request.filePath
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
}

new MainProcess();