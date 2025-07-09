import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../types';

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

const DEFAULT_CONFIG: AppConfig = {
  elevenlabs_api_key: '',
  default_char_limit: 30,
  supported_formats: ['.mp3', '.mp4', '.wav', '.m4a', '.mov', '.avi', '.flv', '.mkv', '.webm'],
  output_directory: path.join(app.getPath('documents'), 'SRT Generator Output')
};

export class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        return { ...DEFAULT_CONFIG, ...parsedConfig };
      }
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
      
      console.log('Writing config to file...');
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
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