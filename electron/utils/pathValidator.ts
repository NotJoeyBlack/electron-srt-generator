import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

/**
 * Path validation utility to prevent path traversal attacks
 * and ensure secure file operations
 */
export class PathValidator {
  private static readonly ALLOWED_DIRECTORIES = [
    app.getPath('documents'),
    app.getPath('desktop'),
    app.getPath('downloads'),
    app.getPath('music'),
    app.getPath('videos'),
    app.getPath('userData'),
    app.getPath('temp')
  ];

  // Common local drive letters for Windows
  private static readonly LOCAL_DRIVE_LETTERS = ['C:', 'D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:', 'L:', 'M:', 'N:', 'O:', 'P:', 'Q:', 'R:', 'S:', 'T:', 'U:', 'V:', 'W:', 'X:', 'Y:', 'Z:'];

  // Dangerous network paths and system locations to block
  private static readonly BLOCKED_PATHS = [
    '\\\\', // UNC network paths
    '//', // Unix network paths  
    'C:\\Windows\\System32',
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    '/System/', // macOS system paths
    '/usr/bin/', // Unix system paths
    '/bin/', // Unix system paths
  ];

  /**
   * Validates if a file path is safe to access
   * @param filePath The path to validate
   * @param allowedExtensions Optional array of allowed file extensions
   * @returns true if path is safe, false otherwise
   */
  static isValidFilePath(filePath: string, allowedExtensions?: string[]): boolean {
    try {
      console.log('[PathValidator] Validating file path:', filePath);
      
      // Resolve the path to handle any relative paths or symlinks
      const resolvedPath = path.resolve(filePath);
      console.log('[PathValidator] Resolved path:', resolvedPath);
      
      // Check if path contains null bytes (security vulnerability)
      if (filePath.includes('\0')) {
        console.log('[PathValidator] REJECTED: Contains null bytes');
        return false;
      }
      
      // Check if path contains path traversal patterns
      if (this.containsPathTraversal(filePath)) {
        console.log('[PathValidator] REJECTED: Contains path traversal patterns');
        return false;
      }
      
      // Check if the resolved path is within allowed directories
      if (!this.isWithinAllowedDirectories(resolvedPath)) {
        console.log('[PathValidator] REJECTED: Not within allowed directories');
        return false;
      }
      
      // Check file extension if provided
      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = path.extname(filePath).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          console.log('[PathValidator] REJECTED: Invalid extension:', ext, 'Allowed:', allowedExtensions);
          return false;
        }
      }
      
      console.log('[PathValidator] ACCEPTED: File path is valid');
      return true;
    } catch (error) {
      // Any error during validation means the path is invalid
      console.log('[PathValidator] REJECTED: Error during validation:', error);
      return false;
    }
  }

  /**
   * Validates if a directory path is safe to access
   * @param dirPath The directory path to validate
   * @returns true if path is safe, false otherwise
   */
  static isValidDirectoryPath(dirPath: string): boolean {
    try {
      // Resolve the path to handle any relative paths or symlinks
      const resolvedPath = path.resolve(dirPath);
      
      // Check if path contains null bytes
      if (dirPath.includes('\0')) {
        return false;
      }
      
      // Check if path contains path traversal patterns
      if (this.containsPathTraversal(dirPath)) {
        return false;
      }
      
      // Check if the resolved path is within allowed directories
      return this.isWithinAllowedDirectories(resolvedPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitizes a filename by removing dangerous characters
   * @param filename The filename to sanitize
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    return filename
      .replace(/[<>:"/\\|?*\0]/g, '_') // Replace dangerous chars with underscore
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Creates a safe output path within the allowed directories
   * @param basePath The base directory path
   * @param filename The filename
   * @returns Safe output path or null if invalid
   */
  static createSafeOutputPath(basePath: string, filename: string): string | null {
    try {
      // Validate the base path
      if (!this.isValidDirectoryPath(basePath)) {
        return null;
      }
      
      // Sanitize the filename
      const safeFilename = this.sanitizeFilename(filename);
      if (!safeFilename) {
        return null;
      }
      
      // Create the full path
      const fullPath = path.join(basePath, safeFilename);
      
      // Validate the final path
      if (!this.isValidFilePath(fullPath)) {
        return null;
      }
      
      return fullPath;
    } catch (error) {
      return null;
    }
  }

  /**
   * Ensures a directory exists and is safe to use
   * @param dirPath Directory path to create
   * @returns true if directory exists or was created successfully
   */
  static async ensureSafeDirectory(dirPath: string): Promise<boolean> {
    try {
      // Validate the directory path first
      if (!this.isValidDirectoryPath(dirPath)) {
        return false;
      }
      
      // Check if directory already exists
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        return stats.isDirectory();
      }
      
      // Create the directory
      fs.mkdirSync(dirPath, { recursive: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if path contains path traversal patterns
   */
  private static containsPathTraversal(filePath: string): boolean {
    const dangerous = [
      '..',
      '..\\',
      '../',
      '..\\..\\',
      '../../',
      '..\\\\',
      '~/',
      '~\\',
    ];
    
    const normalizedPath = path.normalize(filePath);
    
    return dangerous.some(pattern => 
      normalizedPath.includes(pattern) || 
      filePath.includes(pattern)
    );
  }

  /**
   * Checks if path is within allowed directories or local drives (while blocking dangerous paths)
   */
  private static isWithinAllowedDirectories(resolvedPath: string): boolean {
    console.log('[PathValidator] Checking allowed directories for:', resolvedPath);
    console.log('[PathValidator] Allowed directories:', this.ALLOWED_DIRECTORIES);
    
    // First check if path contains any blocked/dangerous locations
    const pathLower = resolvedPath.toLowerCase();
    const isBlocked = this.BLOCKED_PATHS.some(blockedPath => {
      const blocked = pathLower.includes(blockedPath.toLowerCase());
      if (blocked) {
        console.log('[PathValidator] BLOCKED: Path contains dangerous location:', blockedPath);
      }
      return blocked;
    });
    
    if (isBlocked) {
      console.log('[PathValidator] Path blocked due to dangerous location');
      return false;
    }
    
    // Check specific allowed directories first (user folders)
    const inAllowedDirs = this.ALLOWED_DIRECTORIES.some(allowedDir => {
      try {
        const normalizedAllowed = path.resolve(path.normalize(allowedDir));
        const normalizedResolved = path.resolve(path.normalize(resolvedPath));
        
        const allowedLower = normalizedAllowed.toLowerCase();
        const resolvedLower = normalizedResolved.toLowerCase();
        
        const allowedWithSep = allowedLower.endsWith(path.sep) ? allowedLower : allowedLower + path.sep;
        const resolvedWithSep = resolvedLower + path.sep;
        
        const isWithin = resolvedWithSep.startsWith(allowedWithSep) || resolvedLower === allowedLower;
        
        if (isWithin) {
          console.log('[PathValidator] Found in allowed directory:', allowedDir);
        }
        
        return isWithin;
      } catch (error) {
        console.log('[PathValidator] Error comparing with allowed dir:', error);
        return false;
      }
    });
    
    if (inAllowedDirs) {
      console.log('[PathValidator] ALLOWED: In specific allowed directory');
      return true;
    }
    
    // Check if it's on a local drive (Windows)
    if (process.platform === 'win32') {
      const driveLetter = resolvedPath.substring(0, 2).toUpperCase();
      const isLocalDrive = this.LOCAL_DRIVE_LETTERS.includes(driveLetter);
      
      console.log('[PathValidator] Checking local drive:', driveLetter, 'Is local?', isLocalDrive);
      
      if (isLocalDrive) {
        console.log('[PathValidator] ALLOWED: On local drive');
        return true;
      }
    } else {
      // On Unix systems, allow files in user home or common locations
      const userHome = require('os').homedir();
      if (resolvedPath.startsWith(userHome) || 
          resolvedPath.startsWith('/tmp/') || 
          resolvedPath.startsWith('/var/tmp/')) {
        console.log('[PathValidator] ALLOWED: In Unix user/temp location');
        return true;
      }
    }
    
    console.log('[PathValidator] REJECTED: Not in allowed locations');
    return false;
  }
}