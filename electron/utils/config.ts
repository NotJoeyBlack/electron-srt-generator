import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../types';
import { SecureStorage } from './secureStorage';

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

const DEFAULT_CONFIG: AppConfig = {
  elevenlabs_api_key: '',
  default_char_limit: 30,
  supported_formats: ['.mp3', '.mp4', '.wav', '.m4a', '.mov', '.avi', '.flv', '.mkv', '.webm'],
  output_directory: path.join(app.getPath('documents'), 'SRT Generator Output')
};

export class ConfigManager {
  private config: AppConfig;
  private masterKey: Buffer;
  private static readonly API_KEY_STORAGE_KEY = 'elevenlabs_api_key';

  constructor() {
    this.masterKey = SecureStorage.generateMasterKey();
    this.config = this.loadConfig();
  }

  async initialize(): Promise<void> {
    this.config = await this.loadConfigAsync();
  }

  private loadConfig(): AppConfig {
    try {
      let config = { ...DEFAULT_CONFIG };
      
      // Load regular config from file
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        config = { ...config, ...parsedConfig };
      }
      
      // Load API key from secure storage
      const secureApiKey = SecureStorage.retrieveSecureValue(
        ConfigManager.API_KEY_STORAGE_KEY,
        this.masterKey
      );
      
      if (secureApiKey) {
        config.elevenlabs_api_key = secureApiKey;
      }
      
      return config;
    } catch (error) {
      console.error('Error loading config:', error);
    }
    
    return { ...DEFAULT_CONFIG };
  }

  private async loadConfigAsync(): Promise<AppConfig> {
    try {
      let config = { ...DEFAULT_CONFIG };
      
      // Load regular config from file asynchronously
      try {
        await fs.promises.access(CONFIG_FILE);
        const configData = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        config = { ...config, ...parsedConfig };
      } catch (error) {
        // File doesn't exist or can't be read, use defaults
      }
      
      // Load API key from secure storage
      const secureApiKey = SecureStorage.retrieveSecureValue(
        ConfigManager.API_KEY_STORAGE_KEY,
        this.masterKey
      );
      
      if (secureApiKey) {
        config.elevenlabs_api_key = secureApiKey;
      }
      
      return config;
    } catch (error) {
      console.error('Error loading config:', error);
    }
    
    return { ...DEFAULT_CONFIG };
  }

  public saveConfig(updates: Partial<AppConfig>): void {
    console.log('ConfigManager.saveConfig called with:', updates);
    this.config = { ...this.config, ...updates };
    console.log('Updated config:', this.config);
    
    try {
      const configDir = path.dirname(CONFIG_FILE);
      console.log('Config directory:', configDir);
      console.log('Config file path:', CONFIG_FILE);
      
      if (!fs.existsSync(configDir)) {
        console.log('Creating config directory...');
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Separate API key from other config
      const configToSave = { ...this.config };
      
      // Handle API key securely
      if (updates.elevenlabs_api_key !== undefined) {
        if (updates.elevenlabs_api_key.trim() === '') {
          // Remove API key if empty
          SecureStorage.removeSecureValue(ConfigManager.API_KEY_STORAGE_KEY);
        } else {
          // Store API key securely
          SecureStorage.storeSecureValue(
            ConfigManager.API_KEY_STORAGE_KEY,
            updates.elevenlabs_api_key,
            this.masterKey
          );
        }
      }
      
      // Remove API key from regular config file
      delete (configToSave as any).elevenlabs_api_key;
      
      console.log('Writing config to file...');
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
      console.log('Config saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async saveConfigAsync(updates: Partial<AppConfig>): Promise<void> {
    console.log('ConfigManager.saveConfigAsync called with:', updates);
    this.config = { ...this.config, ...updates };
    console.log('Updated config:', this.config);
    
    try {
      const configDir = path.dirname(CONFIG_FILE);
      console.log('Config directory:', configDir);
      console.log('Config file path:', CONFIG_FILE);
      
      try {
        await fs.promises.access(configDir);
      } catch (error) {
        console.log('Creating config directory...');
        await fs.promises.mkdir(configDir, { recursive: true });
      }
      
      // Separate API key from other config
      const configToSave = { ...this.config };
      
      // Handle API key securely
      if (updates.elevenlabs_api_key !== undefined) {
        if (updates.elevenlabs_api_key.trim() === '') {
          // Remove API key if empty
          SecureStorage.removeSecureValue(ConfigManager.API_KEY_STORAGE_KEY);
        } else {
          // Store API key securely
          SecureStorage.storeSecureValue(
            ConfigManager.API_KEY_STORAGE_KEY,
            updates.elevenlabs_api_key,
            this.masterKey
          );
        }
      }
      
      // Remove API key from regular config file
      delete (configToSave as any).elevenlabs_api_key;
      
      console.log('Writing config to file...');
      await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
      console.log('Config saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getApiKey(): string {
    return this.config.elevenlabs_api_key;
  }

  public getOutputDirectory(): string {
    return this.config.output_directory;
  }

  public getSupportedFormats(): string[] {
    return this.config.supported_formats;
  }

  public getDefaultCharLimit(): number {
    return this.config.default_char_limit;
  }
}