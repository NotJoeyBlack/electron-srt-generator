#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TestEnvironmentSetup {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.env.test');
    this.keysPath = path.join(projectRoot, 'test-keys');
  }

  // Generate a fake GitHub token for testing
  generateFakeGitHubToken() {
    const prefix = 'ghp_';
    const randomBytes = crypto.randomBytes(20).toString('hex');
    return prefix + randomBytes;
  }

  // Generate self-signed certificate for testing
  generateSelfSignedCert() {
    const cert = {
      cert: `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKZhj8WRFgz6MA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNVBAMMCWxv
Y2FsaG9zdDAeFw0yMzEwMDEwMDAwMDBaFw0yNDEwMDEwMDAwMDBaMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABIGYXoFPWgqr
yZEbUgqPTfJVSy9/a8nqIwWnlNlxfEF9PNcKZW4EZFbqwXqOvxWEKL8xLyOWMmDl
mNAECAsQ2hUwDQYJKoZIhvcNAQELBQADQQBaKq4LOmvlG3VeR6vHOVFdMNkQKzOQ
5TmOJ8AEHgfGRQnHkZKdF0zf3yT3fNNJ8zfYvZr7yYwJNNzK5vIJGmT2
-----END CERTIFICATE-----`,
      key: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgqZhf5MbPfEGXLgL5
0aXOD5k6xJ8mA6E7mLCZJnDEL2yhRANCAASBmF6BT1oKq8mRG1IKj03yVUsvf2vJ
6iMFp5TZcXxBfTzXCmVuBGRW6sF6jr8VhCi/MS8jljJg5ZjQBAgLENoV
-----END PRIVATE KEY-----`
    };
    
    return cert;
  }

  // Create test environment configuration
  createTestEnvironmentConfig() {
    const config = {
      // GitHub settings
      GITHUB_TOKEN: this.generateFakeGitHubToken(),
      GITHUB_OWNER: 'notjoeyblack',
      GITHUB_REPO: 'electron-srt-generator',
      
      // Mock API settings
      MOCK_API_PORT: '3001',
      MOCK_API_URL: 'http://localhost:3001',
      
      // Test settings
      NODE_ENV: 'test',
      ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
      TEST_TIMEOUT: '30000',
      
      // Electron settings
      ELECTRON_ENABLE_LOGGING: '1',
      ELECTRON_LOG_LEVEL: 'info',
      
      // Update system settings
      UPDATE_CHECK_INTERVAL: '5000',
      UPDATE_DOWNLOAD_TIMEOUT: '60000',
      
      // Security settings (for testing only)
      DISABLE_SIGNATURE_VERIFICATION: '1',
      ALLOW_INSECURE_CONNECTIONS: '1',
      
      // Test data paths
      TEST_DATA_DIR: './test-data',
      TEST_REPORTS_DIR: './test-reports',
      TEST_RESULTS_DIR: './test-results'
    };
    
    // Write to .env.test file
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(this.configPath, envContent);
    console.log(`✅ Created test environment config: ${this.configPath}`);
    
    return config;
  }

  // Create test keys directory
  createTestKeys() {
    if (!fs.existsSync(this.keysPath)) {
      fs.mkdirSync(this.keysPath, { recursive: true });
    }
    
    // Generate self-signed certificate
    const cert = this.generateSelfSignedCert();
    
    // Write certificate files
    fs.writeFileSync(path.join(this.keysPath, 'test-cert.pem'), cert.cert);
    fs.writeFileSync(path.join(this.keysPath, 'test-key.pem'), cert.key);
    
    // Create certificate bundle
    const bundle = {
      cert: cert.cert,
      key: cert.key,
      passphrase: 'test-passphrase'
    };
    
    fs.writeFileSync(path.join(this.keysPath, 'test-bundle.json'), JSON.stringify(bundle, null, 2));
    
    console.log(`✅ Created test keys: ${this.keysPath}`);
    
    return {
      certPath: path.join(this.keysPath, 'test-cert.pem'),
      keyPath: path.join(this.keysPath, 'test-key.pem'),
      bundlePath: path.join(this.keysPath, 'test-bundle.json')
    };
  }

  // Create GitHub CLI configuration for testing
  createGitHubCLIConfig() {
    const ghConfigDir = path.join(this.projectRoot, '.github-cli-test');
    if (!fs.existsSync(ghConfigDir)) {
      fs.mkdirSync(ghConfigDir, { recursive: true });
    }
    
    const config = {
      github: {
        hostname: 'localhost:3001',
        protocol: 'http',
        token: this.generateFakeGitHubToken()
      }
    };
    
    fs.writeFileSync(path.join(ghConfigDir, 'config.yml'), JSON.stringify(config, null, 2));
    console.log(`✅ Created GitHub CLI test config: ${ghConfigDir}`);
    
    return config;
  }

  // Create test data directories
  createTestDirectories() {
    const directories = [
      'test-data',
      'test-reports',
      'test-results',
      'screenshots',
      'videos',
      'logs'
    ];
    
    directories.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    console.log(`✅ Created test directories: ${directories.join(', ')}`);
  }

  // Create test data files
  createTestDataFiles() {
    const testDataDir = path.join(this.projectRoot, 'test-data');
    
    // Create dummy installer files
    const installerSizes = {
      'test-installer.exe': 50 * 1024 * 1024, // 50MB
      'test-installer.dmg': 60 * 1024 * 1024, // 60MB
      'test-installer.AppImage': 55 * 1024 * 1024 // 55MB
    };
    
    Object.entries(installerSizes).forEach(([filename, size]) => {
      const filePath = path.join(testDataDir, filename);
      const buffer = Buffer.alloc(size, 0);
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ Created test installer: ${filename} (${Math.round(size / 1024 / 1024)}MB)`);
    });
  }

  // Create test configuration file
  createTestConfigFile() {
    const testConfig = {
      testEnvironment: {
        mockApiPort: 3001,
        mockApiUrl: 'http://localhost:3001',
        testDataDir: './test-data',
        reportDir: './test-reports',
        logLevel: 'info',
        timeout: 30000
      },
      authentication: {
        githubToken: this.generateFakeGitHubToken(),
        githubUsername: 'notjoeyblack',
        githubRepo: 'electron-srt-generator',
        useRealGitHub: false
      },
      security: {
        verifySignatures: false,
        allowInsecureConnections: true,
        trustedHosts: ['localhost', '127.0.0.1'],
        certificatePath: './test-keys/test-cert.pem'
      },
      platforms: {
        windows: { enabled: true, installer: 'nsis' },
        macos: { enabled: true, installer: 'dmg' },
        linux: { enabled: true, installer: 'AppImage' }
      }
    };
    
    const configPath = path.join(this.projectRoot, 'test-config.json');
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
    console.log(`✅ Updated test configuration: ${configPath}`);
  }

  // Create gitignore entries for test files
  updateGitignore() {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const testEntries = [
      '',
      '# Test environment files',
      '.env.test',
      'test-keys/',
      'test-data/',
      'test-reports/',
      'test-results/',
      'screenshots/',
      'videos/',
      'logs/',
      '.github-cli-test/',
      'update-test-report.json',
      'performance-metrics.json'
    ];
    
    if (fs.existsSync(gitignorePath)) {
      const existingContent = fs.readFileSync(gitignorePath, 'utf8');
      const newContent = existingContent + '\n' + testEntries.join('\n');
      fs.writeFileSync(gitignorePath, newContent);
    } else {
      fs.writeFileSync(gitignorePath, testEntries.join('\n'));
    }
    
    console.log(`✅ Updated .gitignore with test entries`);
  }

  // Setup complete test environment
  setupAll() {
    console.log('🚀 Setting up automated test environment...\n');
    
    try {
      // Create directories
      this.createTestDirectories();
      
      // Create configuration
      const config = this.createTestEnvironmentConfig();
      
      // Create test keys
      const keys = this.createTestKeys();
      
      // Create GitHub CLI config
      const ghConfig = this.createGitHubCLIConfig();
      
      // Create test data
      this.createTestDataFiles();
      
      // Create test config
      this.createTestConfigFile();
      
      // Update gitignore
      this.updateGitignore();
      
      console.log('\n🎉 Test environment setup complete!\n');
      console.log('Available test commands:');
      console.log('  npm run test:unit           # Run unit tests');
      console.log('  npm run test:integration    # Run integration tests');
      console.log('  npm run test:e2e            # Run E2E tests');
      console.log('  npm run test:update-system  # Run full update system tests');
      console.log('  npm run test:docker         # Run tests in Docker');
      console.log('  node scripts/run-update-tests.js  # Run orchestrated tests');
      console.log('');
      console.log('Test environment configured with:');
      console.log(`  - Mock GitHub API on port ${config.MOCK_API_PORT}`);
      console.log(`  - Test certificates in ${keys.certPath}`);
      console.log(`  - Test data in ${config.TEST_DATA_DIR}`);
      console.log(`  - Environment config in ${this.configPath}`);
      console.log('');
      console.log('⚠️  Note: All authentication tokens are fake and for testing only!');
      
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      process.exit(1);
    }
  }

  // Clean up test environment
  cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    const pathsToClean = [
      this.configPath,
      this.keysPath,
      path.join(this.projectRoot, 'test-data'),
      path.join(this.projectRoot, 'test-reports'),
      path.join(this.projectRoot, 'test-results'),
      path.join(this.projectRoot, 'screenshots'),
      path.join(this.projectRoot, 'videos'),
      path.join(this.projectRoot, 'logs'),
      path.join(this.projectRoot, '.github-cli-test')
    ];
    
    pathsToClean.forEach(pathToClean => {
      if (fs.existsSync(pathToClean)) {
        if (fs.statSync(pathToClean).isDirectory()) {
          fs.rmSync(pathToClean, { recursive: true, force: true });
        } else {
          fs.unlinkSync(pathToClean);
        }
        console.log(`✅ Cleaned up: ${pathToClean}`);
      }
    });
    
    console.log('✨ Test environment cleanup complete!');
  }
}

// Command line interface
function main() {
  const projectRoot = path.join(__dirname, '..');
  const setup = new TestEnvironmentSetup(projectRoot);
  
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setup.setupAll();
      break;
    case 'cleanup':
      setup.cleanup();
      break;
    default:
      console.log('Usage: node scripts/setup-test-environment.js [setup|cleanup]');
      console.log('');
      console.log('Commands:');
      console.log('  setup   - Create complete test environment');
      console.log('  cleanup - Remove all test environment files');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestEnvironmentSetup;