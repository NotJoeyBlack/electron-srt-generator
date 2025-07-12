import * as crypto from 'crypto';
import { app } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Secure storage utility for encrypting sensitive data like API keys
 */
export class SecureStorage {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits

  /**
   * Encrypts a string value using AES-256-CBC
   * @param value The string to encrypt
   * @param masterKey The encryption key
   * @returns Encrypted data as base64 string
   */
  static encrypt(value: string, masterKey: Buffer): string {
    try {
      // Generate a random IV for each encryption
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, masterKey, iv);
      cipher.setAutoPadding(true);
      
      // Encrypt the value
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV + encrypted data
      const result = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
      
      return result.toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt value');
    }
  }

  /**
   * Decrypts a base64 encrypted string
   * @param encryptedValue The encrypted value as base64
   * @param masterKey The decryption key
   * @returns Decrypted string
   */
  static decrypt(encryptedValue: string, masterKey: Buffer): string {
    try {
      // Parse the encrypted data
      const data = Buffer.from(encryptedValue, 'base64');
      
      // Extract IV and encrypted data
      const iv = data.subarray(0, this.IV_LENGTH);
      const encrypted = data.subarray(this.IV_LENGTH);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, masterKey, iv);
      decipher.setAutoPadding(true);
      
      // Decrypt the value
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt value');
    }
  }

  /**
   * Generates a master key based on machine-specific information
   * @returns Master key buffer
   */
  static generateMasterKey(): Buffer {
    try {
      // Collect machine-specific information
      const machineInfo = [
        os.hostname(),
        os.userInfo().username,
        app.getPath('userData'),
        process.platform,
        os.arch()
      ].join('|');
      
      // Add a static salt for additional security
      const staticSalt = 'SRT_GENERATOR_SECURE_SALT_2024';
      
      // Generate a deterministic key from machine info
      const key = crypto.pbkdf2Sync(
        machineInfo,
        staticSalt,
        100000, // iterations
        this.KEY_LENGTH,
        'sha256'
      );
      
      return key;
    } catch (error) {
      throw new Error('Failed to generate master key');
    }
  }

  /**
   * Securely stores an encrypted value
   * @param key The key to store the value under
   * @param value The value to encrypt and store
   * @param masterKey The encryption key
   */
  static storeSecureValue(key: string, value: string, masterKey: Buffer): void {
    try {
      if (!value || value.trim() === '') {
        // Don't store empty values
        return;
      }
      
      const encrypted = this.encrypt(value, masterKey);
      
      // Store in a secure location
      const secureDir = path.join(app.getPath('userData'), 'secure');
      if (!fs.existsSync(secureDir)) {
        fs.mkdirSync(secureDir, { mode: 0o700 }); // Only owner can read/write
      }
      
      const filePath = path.join(secureDir, `${key}.enc`);
      fs.writeFileSync(filePath, encrypted, { mode: 0o600 }); // Only owner can read/write
    } catch (error) {
      throw new Error(`Failed to store secure value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves and decrypts a stored value
   * @param key The key to retrieve
   * @param masterKey The decryption key
   * @returns Decrypted value or null if not found
   */
  static retrieveSecureValue(key: string, masterKey: Buffer): string | null {
    try {
      const secureDir = path.join(app.getPath('userData'), 'secure');
      const filePath = path.join(secureDir, `${key}.enc`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const encrypted = fs.readFileSync(filePath, 'utf8');
      return this.decrypt(encrypted, masterKey);
    } catch (error) {
      // Return null if decryption fails (e.g., wrong key, corrupted data)
      return null;
    }
  }

  /**
   * Removes a stored secure value
   * @param key The key to remove
   */
  static removeSecureValue(key: string): void {
    try {
      const secureDir = path.join(app.getPath('userData'), 'secure');
      const filePath = path.join(secureDir, `${key}.enc`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Ignore errors when removing (file might not exist)
    }
  }

  /**
   * Checks if a secure value exists
   * @param key The key to check
   * @returns True if the value exists
   */
  static hasSecureValue(key: string): boolean {
    try {
      const secureDir = path.join(app.getPath('userData'), 'secure');
      const filePath = path.join(secureDir, `${key}.enc`);
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }
}