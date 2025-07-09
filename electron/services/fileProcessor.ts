import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../utils/config';

export class FileProcessor {
  private configManager: ConfigManager;
  private maxFileSize = 100 * 1024 * 1024; // 100MB limit

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async validateFile(filePath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      // Check file stats
      const stats = fs.statSync(filePath);
      
      // Check if it's a file (not directory)
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new Error('File is too large (maximum 100MB)');
      }

      // Check file extension
      const extension = path.extname(filePath).toLowerCase();
      const supportedFormats = this.configManager.getSupportedFormats();
      
      if (!supportedFormats.includes(extension)) {
        throw new Error(`Unsupported file format: ${extension}`);
      }

      // Check if file is readable
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch (error) {
        throw new Error('File is not readable');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  getFileInfo(filePath: string): {
    name: string;
    size: number;
    extension: string;
    sizeFormatted: string;
  } {
    const stats = fs.statSync(filePath);
    const name = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const size = stats.size;
    
    return {
      name,
      size,
      extension,
      sizeFormatted: this.formatFileSize(size)
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  createOutputPath(inputFilePath: string): string {
    const outputDir = this.configManager.getOutputDirectory();
    const inputName = path.basename(inputFilePath, path.extname(inputFilePath));
    const outputPath = path.join(outputDir, `${inputName}.srt`);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    return outputPath;
  }

  async ensureOutputDirectory(): Promise<void> {
    const outputDir = this.configManager.getOutputDirectory();
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }
}