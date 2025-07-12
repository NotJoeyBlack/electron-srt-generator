import { contextBridge, ipcRenderer } from 'electron';
import { TranscriptionRequest, TranscriptionResponse, ProgressUpdate, FileInfo, AppConfig } from './types';
import { UpdateStatus } from './services/updateManager';

const electronAPI = {
  selectFile: (): Promise<FileInfo | null> => ipcRenderer.invoke('file:select'),
  
  startTranscription: (request: TranscriptionRequest): Promise<void> => 
    ipcRenderer.invoke('transcription:start', request),
  
  onProgress: (callback: (progress: ProgressUpdate) => void) => {
    ipcRenderer.on('transcription:progress', (_, progress) => callback(progress));
  },
  
  onComplete: (callback: (response: TranscriptionResponse) => void) => {
    ipcRenderer.on('transcription:complete', (_, response) => callback(response));
  },
  
  onError: (callback: (error: string, troubleshooting?: string) => void) => {
    ipcRenderer.on('transcription:error', (_, error, troubleshooting) => callback(error, troubleshooting));
  },
  
  openFile: (filePath: string): Promise<void> => 
    ipcRenderer.invoke('file:open', filePath),
  
  showItemInFolder: (filePath: string): Promise<void> => 
    ipcRenderer.invoke('file:show-in-folder', filePath),
  
  getConfig: (): Promise<AppConfig> => 
    ipcRenderer.invoke('config:get'),
  
  saveConfig: (config: Partial<AppConfig>): Promise<void> => 
    ipcRenderer.invoke('config:save', config),
  
  // Update-related functions
  checkForUpdates: (): Promise<void> => 
    ipcRenderer.invoke('update:check'),
  
  downloadUpdate: (): Promise<void> => 
    ipcRenderer.invoke('update:download'),
  
  installUpdate: (): Promise<void> => 
    ipcRenderer.invoke('update:install'),
  
  getUpdateStatus: (): Promise<UpdateStatus> => 
    ipcRenderer.invoke('update:get-status'),
  
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    ipcRenderer.on('update-status', (_, status) => callback(status));
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}