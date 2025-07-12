import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import { ConfigManager } from '../utils/config';

interface ElevenLabsTranscriptionResponse {
  text: string;
  alignment: {
    characters: Array<{
      character: string;
      start: number;
      end: number;
    }>;
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
  speakers: Array<{
    id: string;
    name: string;
  }>;
  words: Array<{
    text: string;
    start: number;
    end: number;
    type: string;
    speaker_id?: string;
    logprob?: number;
    characters?: any;
  }>;
}

export class ElevenLabsService {
  private configManager: ConfigManager;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async transcribeFile(filePath: string): Promise<ElevenLabsTranscriptionResponse> {
    const apiKey = this.configManager.getApiKey();
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key is not configured. Please add your API key in the settings.');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Create file stream with proper cleanup
    const fileStream = fs.createReadStream(filePath);
    
    // Set up error handling and cleanup for the stream
    const cleanupStream = () => {
      if (fileStream && !fileStream.destroyed) {
        fileStream.destroy();
      }
    };

    try {
      const formData = new FormData();
      formData.append('file', fileStream);
      formData.append('model_id', 'scribe_v1');
      formData.append('language_code', 'en');
      formData.append('diarize', 'true');
      formData.append('timestamps_granularity', 'word');
      formData.append('tag_audio_events', 'true');

      const response = await axios.post(
        `${this.baseUrl}/speech-to-text`,
        formData,
        {
          headers: {
            'xi-api-key': apiKey,
            ...formData.getHeaders()
          },
          timeout: 300000, // 5 minutes timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      // Clean up the stream after successful upload
      cleanupStream();

      if (!response.data) {
        throw new Error('Empty response from ElevenLabs API');
      }

      // Validate response structure
      if (!response.data.text) {
        throw new Error('Invalid response format from ElevenLabs API: missing text');
      }
      
      if (!response.data.words) {
        throw new Error('Invalid response format from ElevenLabs API: missing words');
      }

      return response.data;
    } catch (error: any) {
      // Ensure stream is cleaned up on error
      cleanupStream();
      if (error.response) {
        // API responded with an error
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('Invalid API key. Please check your ElevenLabs API key in the settings.');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        } else if (status === 413) {
          throw new Error('File too large. Please try with a smaller file.');
        } else if (status === 422) {
          // Include more detailed error information for debugging
          const errorDetails = data?.detail || data?.message || 'Unknown validation error';
          throw new Error(`Invalid parameters or file format: ${errorDetails}`);
        } else if (status >= 500) {
          throw new Error('ElevenLabs service is temporarily unavailable. Please try again later.');
        } else {
          throw new Error(`ElevenLabs API error: ${data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your internet connection.');
      } else {
        // Other error
        throw error;
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    const apiKey = this.configManager.getApiKey();
    
    if (!apiKey) {
      return false;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': apiKey
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}