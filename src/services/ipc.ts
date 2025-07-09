import { TranscriptionRequest, FileInfo, AppConfig, ProgressUpdate, TranscriptionResponse } from '../types';

export class IPCService {
  private static instance: IPCService;
  
  private constructor() {}
  
  public static getInstance(): IPCService {
    if (!IPCService.instance) {
      IPCService.instance = new IPCService();
    }
    return IPCService.instance;
  }

  public async selectFile(): Promise<FileInfo | null> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    try {
      return await window.electronAPI.selectFile();
    } catch (error) {
      console.error('Error selecting file:', error);
      throw error;
    }
  }

  public async startTranscription(request: TranscriptionRequest): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    try {
      await window.electronAPI.startTranscription(request);
    } catch (error) {
      console.error('Error starting transcription:', error);
      throw error;
    }
  }

  public async openFile(filePath: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    try {
      await window.electronAPI.openFile(filePath);
    } catch (error) {
      console.error('Error opening file:', error);
      throw error;
    }
  }

  public async showItemInFolder(filePath: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    try {
      await window.electronAPI.showItemInFolder(filePath);
    } catch (error) {
      console.error('Error showing item in folder:', error);
      throw error;
    }
  }

  public async getConfig(): Promise<AppConfig> {
    if (!window.electronAPI) {
      console.log('Electron API not available, returning default config');
      // Return default config for browser/development mode
      return {
        elevenlabs_api_key: '',
        default_char_limit: 30,
        supported_formats: ['.mp3', '.mp4', '.wav', '.m4a', '.mov', '.avi', '.flv', '.mkv', '.webm'],
        output_directory: './output'
      };
    }
    
    try {
      return await window.electronAPI.getConfig();
    } catch (error) {
      console.error('Error getting config:', error);
      throw error;
    }
  }

  public async saveConfig(config: Partial<AppConfig>): Promise<void> {
    console.log('IPC Service saveConfig called with:', config);
    if (!window.electronAPI) {
      console.log('Electron API not available, config save skipped in browser mode');
      // In browser/development mode, just log the config - no actual save
      console.log('Config would be saved:', config);
      return;
    }
    
    try {
      console.log('Calling window.electronAPI.saveConfig...');
      await window.electronAPI.saveConfig(config);
      console.log('Config saved successfully via IPC');
    } catch (error) {
      console.error('Error saving config via IPC:', error);
      throw error;
    }
  }

  public onProgress(callback: (progress: ProgressUpdate) => void): void {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    window.electronAPI.onProgress(callback);
  }

  public onComplete(callback: (response: TranscriptionResponse) => void): void {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    window.electronAPI.onComplete(callback);
  }

  public onError(callback: (error: string, troubleshooting?: string) => void): void {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    window.electronAPI.onError(callback);
  }
}