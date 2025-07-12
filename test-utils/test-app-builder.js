const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestAppBuilder {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.testDataDir = path.join(projectRoot, 'test-data');
    this.originalPackageJson = null;
    this.ensureTestDataDir();
  }

  ensureTestDataDir() {
    if (!fs.existsSync(this.testDataDir)) {
      fs.mkdirSync(this.testDataDir, { recursive: true });
    }
  }

  // Save original package.json
  saveOriginalPackageJson() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.originalPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`[TestAppBuilder] Saved original package.json (version: ${this.originalPackageJson.version})`);
  }

  // Restore original package.json
  restoreOriginalPackageJson() {
    if (this.originalPackageJson) {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      fs.writeFileSync(packageJsonPath, JSON.stringify(this.originalPackageJson, null, 2));
      console.log(`[TestAppBuilder] Restored original package.json (version: ${this.originalPackageJson.version})`);
    }
  }

  // Update package.json version
  updatePackageJsonVersion(version) {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`[TestAppBuilder] Updated package.json version to ${version}`);
  }

  // Update app configuration for testing
  updateAppConfigForTesting(mockApiUrl) {
    const updateManagerPath = path.join(this.projectRoot, 'electron/services/updateManager.ts');
    let content = fs.readFileSync(updateManagerPath, 'utf8');
    
    // Replace GitHub API URL with mock URL
    content = content.replace(
      /autoUpdater\.setFeedURL\({[^}]+}\);/,
      `autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'notjoeyblack',
        repo: 'electron-srt-generator',
        private: false,
        releaseType: 'release',
        requestHeaders: {
          'Authorization': 'token fake-token'
        }
      });
      
      // Override the update server URL for testing
      (autoUpdater as any).updateConfigPath = '${mockApiUrl}/repos/notjoeyblack/electron-srt-generator/releases/latest';`
    );
    
    fs.writeFileSync(updateManagerPath, content);
    console.log(`[TestAppBuilder] Updated UpdateManager to use mock API: ${mockApiUrl}`);
  }

  // Build the application
  async buildApp() {
    console.log('[TestAppBuilder] Building application...');
    
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[TestAppBuilder] Build completed successfully');
          resolve();
        } else {
          console.error(`[TestAppBuilder] Build failed with code ${code}`);
          reject(new Error(`Build failed with code ${code}`));
        }
      });

      buildProcess.on('error', (err) => {
        console.error('[TestAppBuilder] Build error:', err);
        reject(err);
      });
    });
  }

  // Create a distribution package
  async createDistribution() {
    console.log('[TestAppBuilder] Creating distribution package...');
    
    return new Promise((resolve, reject) => {
      const distProcess = spawn('npm', ['run', 'dist'], {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      distProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[TestAppBuilder] Distribution created successfully');
          resolve();
        } else {
          console.error(`[TestAppBuilder] Distribution failed with code ${code}`);
          reject(new Error(`Distribution failed with code ${code}`));
        }
      });

      distProcess.on('error', (err) => {
        console.error('[TestAppBuilder] Distribution error:', err);
        reject(err);
      });
    });
  }

  // Create test installers for different versions
  async createTestInstallers(versions) {
    console.log('[TestAppBuilder] Creating test installers for versions:', versions);
    
    // Save original package.json
    this.saveOriginalPackageJson();
    
    const installers = [];
    
    try {
      for (const version of versions) {
        console.log(`[TestAppBuilder] Creating installer for version ${version}...`);
        
        // Update version
        this.updatePackageJsonVersion(version);
        
        // Build the app
        await this.buildApp();
        
        // Create distribution
        await this.createDistribution();
        
        // Move created files to test-data directory
        const releaseDir = path.join(this.projectRoot, 'release');
        if (fs.existsSync(releaseDir)) {
          const files = fs.readdirSync(releaseDir);
          for (const file of files) {
            if (file.includes('.exe') || file.includes('.dmg') || file.includes('.AppImage')) {
              const sourcePath = path.join(releaseDir, file);
              const destPath = path.join(this.testDataDir, `${version}-${file}`);
              fs.copyFileSync(sourcePath, destPath);
              
              installers.push({
                version,
                filename: `${version}-${file}`,
                path: destPath,
                size: fs.statSync(destPath).size
              });
              
              console.log(`[TestAppBuilder] Created installer: ${destPath}`);
            }
          }
        }
      }
    } finally {
      // Restore original package.json
      this.restoreOriginalPackageJson();
    }
    
    return installers;
  }

  // Create mock installer files (for faster testing)
  createMockInstallers(versions) {
    console.log('[TestAppBuilder] Creating mock installers for versions:', versions);
    
    const installers = [];
    
    for (const version of versions) {
      const platforms = [
        { ext: 'exe', name: 'Setup.exe', size: 50 * 1024 * 1024 }, // 50MB
        { ext: 'dmg', name: 'SRT Generator.dmg', size: 60 * 1024 * 1024 }, // 60MB
        { ext: 'AppImage', name: 'SRT Generator.AppImage', size: 55 * 1024 * 1024 } // 55MB
      ];
      
      for (const platform of platforms) {
        const filename = `${version}-${platform.name}`;
        const filepath = path.join(this.testDataDir, filename);
        
        // Create a mock file with the specified size
        const buffer = Buffer.alloc(platform.size, 0);
        fs.writeFileSync(filepath, buffer);
        
        installers.push({
          version,
          filename,
          path: filepath,
          size: platform.size,
          platform: platform.ext
        });
        
        console.log(`[TestAppBuilder] Created mock installer: ${filename} (${Math.round(platform.size / 1024 / 1024)}MB)`);
      }
    }
    
    return installers;
  }

  // Clean up test data
  cleanup() {
    console.log('[TestAppBuilder] Cleaning up test data...');
    
    if (fs.existsSync(this.testDataDir)) {
      const files = fs.readdirSync(this.testDataDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.testDataDir, file));
      }
      console.log(`[TestAppBuilder] Cleaned up ${files.length} test files`);
    }
    
    // Restore original package.json if needed
    this.restoreOriginalPackageJson();
  }

  // Get test data directory
  getTestDataDir() {
    return this.testDataDir;
  }
}

module.exports = TestAppBuilder;