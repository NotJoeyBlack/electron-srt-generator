export interface TranscriptionRequest {
  filePath: string;
  characterLimit: number;
}

export interface TranscriptionResponse {
  success: boolean;
  srtPath?: string;
  error?: string;
  troubleshooting?: string;
}

export interface ProgressUpdate {
  stage: 'validation' | 'upload' | 'processing' | 'srt-generation' | 'complete';
  percentage: number;
  message: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface AppConfig {
  elevenlabs_api_key: string;
  default_char_limit: number;
  supported_formats: string[];
  output_directory: string;
}

export interface ElectronAPI {
  selectFile: () => Promise<FileInfo | null>;
  startTranscription: (request: TranscriptionRequest) => Promise<void>;
  onProgress: (callback: (progress: ProgressUpdate) => void) => void;
  onComplete: (callback: (response: TranscriptionResponse) => void) => void;
  onError: (callback: (error: string, troubleshooting?: string) => void) => void;
  openFile: (filePath: string) => Promise<void>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getConfig: () => Promise<AppConfig>;
  saveConfig: (config: Partial<AppConfig>) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}