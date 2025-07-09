export interface ErrorInfo {
  message: string;
  troubleshooting: string;
}

export class ErrorHandler {
  static getErrorInfo(error: any): ErrorInfo {
    if (error.code === 'ENOENT') {
      return {
        message: 'File not found',
        troubleshooting: 'Please ensure the file exists and you have permission to access it.'
      };
    }

    if (error.code === 'EACCES') {
      return {
        message: 'Permission denied',
        troubleshooting: 'Please check file permissions and try running as administrator if necessary.'
      };
    }

    if (error.response?.status === 401) {
      return {
        message: 'Invalid API key',
        troubleshooting: 'Please check your ElevenLabs API key in the settings. You can get your API key from https://elevenlabs.io/settings'
      };
    }

    if (error.response?.status === 429) {
      return {
        message: 'Rate limit exceeded',
        troubleshooting: 'You have exceeded the API rate limit. Please wait a few minutes before trying again.'
      };
    }

    if (error.response?.status === 413) {
      return {
        message: 'File too large',
        troubleshooting: 'The selected file is too large. Please try with a smaller file or compress it first.'
      };
    }

    if (error.response?.status === 422) {
      return {
        message: 'Invalid file or parameters',
        troubleshooting: 'The file format may not be supported, the file may be corrupted, or the audio quality may be too low. Please try with a different file or check that your WAV file is not corrupted. Supported formats: MP3, MP4, WAV, M4A, MOV, AVI, FLV, MKV, WEBM.'
      };
    }

    if (error.response?.status >= 500) {
      return {
        message: 'ElevenLabs service unavailable',
        troubleshooting: 'The ElevenLabs service is temporarily unavailable. Please try again later.'
      };
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        message: 'Network connection failed',
        troubleshooting: 'Please check your internet connection and try again. If you are behind a firewall, ensure that HTTPS requests to elevenlabs.io are allowed.'
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        message: 'Request timed out',
        troubleshooting: 'The request took too long to complete. This may be due to a large file size or slow internet connection. Please try again.'
      };
    }

    if (error.message?.includes('SRT')) {
      return {
        message: 'SRT processing failed',
        troubleshooting: 'There was an error processing the subtitle file. Please ensure the transcription was successful and try again.'
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
      troubleshooting: 'Please try again. If the problem persists, check your internet connection and API key settings.'
    };
  }
}