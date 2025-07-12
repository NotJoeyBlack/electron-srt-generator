import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../utils/config';
import { PathValidator } from '../utils/pathValidator';

export class FileProcessor {
  private configManager: ConfigManager;
  private maxFileSize = 100 * 1024 * 1024; // 100MB limit

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async validateFile(filePath: string): Promise<boolean> {
    try {
      // Validate file path for security (path traversal protection)
      const allowedFormats = this.configManager.getSupportedFormats();
      if (!PathValidator.isValidFilePath(filePath, allowedFormats)) {
        throw new Error('Invalid file path or file location not allowed');
      }
      
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
      const configFormats = this.configManager.getSupportedFormats();
      
      if (!configFormats.includes(extension)) {
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

  async createOutputPath(inputFilePath: string): Promise<string> {
    const outputDir = this.configManager.getOutputDirectory();
    const inputName = path.basename(inputFilePath, path.extname(inputFilePath));
    
    // Sanitize the filename to prevent path traversal
    const safeFilename = PathValidator.sanitizeFilename(`${inputName}.srt`);
    const outputPath = PathValidator.createSafeOutputPath(outputDir, safeFilename);
    
    if (!outputPath) {
      throw new Error('Unable to create safe output path');
    }
    
    // Ensure output directory exists safely
    if (!await PathValidator.ensureSafeDirectory(outputDir)) {
      throw new Error('Unable to create or access output directory');
    }
    
    return outputPath;
  }

  async ensureOutputDirectory(): Promise<void> {
    const outputDir = this.configManager.getOutputDirectory();
    
    // Use the safe directory creation method
    if (!await PathValidator.ensureSafeDirectory(outputDir)) {
      throw new Error('Unable to create or access output directory');
    }
  }
}