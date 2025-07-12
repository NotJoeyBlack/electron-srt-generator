const MockGitHubAPI = require('../../test-utils/mock-github-api');
const TestAppBuilder = require('../../test-utils/test-app-builder');
const path = require('path');

describe('Update System Integration Tests', () => {
  let mockApi;
  let appBuilder;
  const projectRoot = path.join(__dirname, '../../');

  beforeAll(async () => {
    // Start mock GitHub API
    mockApi = new MockGitHubAPI(3001);
    await mockApi.start();
    
    // Initialize app builder
    appBuilder = new TestAppBuilder(projectRoot);
  });

  afterAll(async () => {
    // Stop mock API
    await mockApi.stop();
    
    // Clean up test data
    appBuilder.cleanup();
  });

  beforeEach(() => {
    // Clear releases before each test
    mockApi.clearReleases();
  });

  describe('GitHub API Mock Server', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${mockApi.getBaseUrl()}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    it('should return 404 for no releases', async () => {
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      
      expect(response.status).toBe(404);
    });

    it('should return latest release when available', async () => {
      // Add a test release
      mockApi.addRelease({
        tag_name: 'v1.2.0',
        name: 'Version 1.2.0',
        body: 'Test release for integration testing'
      });
      
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tag_name).toBe('v1.2.0');
      expect(data.name).toBe('Version 1.2.0');
    });
  });

  describe('Test App Builder', () => {
    it('should create mock installers', () => {
      const versions = ['1.1.0', '1.2.0'];
      const installers = appBuilder.createMockInstallers(versions);
      
      expect(installers).toHaveLength(6); // 2 versions × 3 platforms
      expect(installers[0]).toHaveProperty('version');
      expect(installers[0]).toHaveProperty('filename');
      expect(installers[0]).toHaveProperty('path');
      expect(installers[0]).toHaveProperty('size');
    });

    it('should save and restore package.json', () => {
      const originalVersion = '1.0.0';
      const testVersion = '1.5.0';
      
      // Save original
      appBuilder.saveOriginalPackageJson();
      
      // Update version
      appBuilder.updatePackageJsonVersion(testVersion);
      
      // Read package.json and verify change
      const packageJson = require(path.join(projectRoot, 'package.json'));
      expect(packageJson.version).toBe(testVersion);
      
      // Restore original
      appBuilder.restoreOriginalPackageJson();
      
      // Verify restoration
      const restoredPackageJson = require(path.join(projectRoot, 'package.json'));
      expect(restoredPackageJson.version).toBe(originalVersion);
    });
  });

  describe('Release Management', () => {
    it('should create releases with assets', () => {
      const versions = ['1.1.0', '1.2.0'];
      const installers = appBuilder.createMockInstallers(versions);
      
      // Create releases for each version
      versions.forEach(version => {
        const versionInstallers = installers.filter(i => i.version === version);
        
        // Add release
        mockApi.addRelease({
          tag_name: `v${version}`,
          name: `Version ${version}`,
          body: `Test release for version ${version}`
        });
        
        // Add assets
        versionInstallers.forEach(installer => {
          mockApi.addAsset(`v${version}`, {
            name: installer.filename,
            content_type: 'application/octet-stream',
            size: installer.size
          });
        });
      });
      
      // Verify releases were created
      expect(mockApi.releases).toHaveLength(2);
      expect(mockApi.releases[0].tag_name).toBe('v1.2.0'); // Latest first
      expect(mockApi.releases[1].tag_name).toBe('v1.1.0');
      
      // Verify assets were added
      expect(mockApi.releases[0].assets).toHaveLength(3);
      expect(mockApi.releases[1].assets).toHaveLength(3);
    });
  });

  describe('Update Flow Simulation', () => {
    beforeEach(() => {
      // Set up a typical update scenario
      const versions = ['1.0.0', '1.1.0', '1.2.0'];
      const installers = appBuilder.createMockInstallers(versions);
      
      // Create releases (newer versions first)
      versions.reverse().forEach(version => {
        const versionInstallers = installers.filter(i => i.version === version);
        
        mockApi.addRelease({
          tag_name: `v${version}`,
          name: `Version ${version}`,
          body: `Release notes for version ${version}`
        });
        
        versionInstallers.forEach(installer => {
          mockApi.addAsset(`v${version}`, {
            name: installer.filename,
            content_type: 'application/octet-stream',
            size: installer.size
          });
        });
      });
    });

    it('should detect available updates', async () => {
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tag_name).toBe('v1.2.0');
      expect(data.assets).toHaveLength(3);
    });

    it('should download update assets', async () => {
      const latestResponse = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      const latestRelease = await latestResponse.json();
      
      // Try to download the first asset
      const asset = latestRelease.assets[0];
      const assetResponse = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/assets/${asset.id}`);
      
      expect(assetResponse.status).toBe(200);
      expect(assetResponse.headers.get('content-type')).toContain('application/octet-stream');
    });

    it('should handle version comparison', async () => {
      // Get all releases
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases`);
      const releases = await response.json();
      
      expect(releases).toHaveLength(3);
      
      // Verify they are in descending order (newest first)
      expect(releases[0].tag_name).toBe('v1.2.0');
      expect(releases[1].tag_name).toBe('v1.1.0');
      expect(releases[2].tag_name).toBe('v1.0.0');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing assets', async () => {
      // Add release without assets
      mockApi.addRelease({
        tag_name: 'v1.1.0',
        name: 'Version 1.1.0',
        body: 'Release with no assets'
      });
      
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.assets).toHaveLength(0);
    });

    it('should handle non-existent asset download', async () => {
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/assets/999999`);
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid release requests', async () => {
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/999999`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      // Add test release
      mockApi.addRelease({
        tag_name: 'v1.1.0',
        name: 'Version 1.1.0',
        body: 'Performance test release'
      });
      
      // Make multiple concurrent requests
      const requests = Array(10).fill(0).map(() => 
        fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`)
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle large number of releases', () => {
      // Add many releases
      for (let i = 1; i <= 100; i++) {
        mockApi.addRelease({
          tag_name: `v1.${i}.0`,
          name: `Version 1.${i}.0`,
          body: `Release ${i}`
        });
      }
      
      expect(mockApi.releases).toHaveLength(100);
      expect(mockApi.releases[0].tag_name).toBe('v1.100.0'); // Latest first
    });
  });
});