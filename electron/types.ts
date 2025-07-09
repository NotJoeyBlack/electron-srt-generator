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