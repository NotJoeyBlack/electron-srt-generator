const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

class MockGitHubAPI {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.server = null;
    this.releases = [];
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../test-data')));
  }

  setupRoutes() {
    // Get latest release
    this.app.get('/repos/:owner/:repo/releases/latest', (req, res) => {
      const { owner, repo } = req.params;
      console.log(`[MockGitHubAPI] GET /repos/${owner}/${repo}/releases/latest`);
      
      if (this.releases.length === 0) {
        return res.status(404).json({
          message: 'Not Found',
          documentation_url: 'https://docs.github.com/rest/releases/releases#get-the-latest-release'
        });
      }

      const latestRelease = this.releases[0];
      res.json(latestRelease);
    });

    // Get all releases
    this.app.get('/repos/:owner/:repo/releases', (req, res) => {
      const { owner, repo } = req.params;
      console.log(`[MockGitHubAPI] GET /repos/${owner}/${repo}/releases`);
      
      res.json(this.releases);
    });

    // Get specific release
    this.app.get('/repos/:owner/:repo/releases/:release_id', (req, res) => {
      const { owner, repo, release_id } = req.params;
      console.log(`[MockGitHubAPI] GET /repos/${owner}/${repo}/releases/${release_id}`);
      
      const release = this.releases.find(r => r.id === parseInt(release_id));
      if (!release) {
        return res.status(404).json({
          message: 'Not Found'
        });
      }
      
      res.json(release);
    });

    // Download release asset
    this.app.get('/repos/:owner/:repo/releases/assets/:asset_id', (req, res) => {
      const { owner, repo, asset_id } = req.params;
      console.log(`[MockGitHubAPI] GET /repos/${owner}/${repo}/releases/assets/${asset_id}`);
      
      // Find the asset
      let asset = null;
      for (const release of this.releases) {
        asset = release.assets.find(a => a.id == asset_id); // Use loose equality
        if (asset) break;
      }
      
      if (!asset) {
        console.log(`[MockGitHubAPI] Asset ${asset_id} not found`);
        return res.status(404).json({
          message: 'Not Found'
        });
      }
      
      const filePath = path.join(__dirname, '../test-data', asset.name);
      if (!fs.existsSync(filePath)) {
        console.log(`[MockGitHubAPI] Asset file not found: ${filePath}`);
        return res.status(404).json({
          message: 'Asset file not found'
        });
      }
      
      res.download(filePath, asset.name);
    });

    // Get asset info
    this.app.get('/repos/:owner/:repo/releases/assets/:asset_id/info', (req, res) => {
      const { owner, repo, asset_id } = req.params;
      console.log(`[MockGitHubAPI] GET /repos/${owner}/${repo}/releases/assets/${asset_id}/info`);
      
      // Find the asset
      let asset = null;
      for (const release of this.releases) {
        asset = release.assets.find(a => a.id === parseInt(asset_id));
        if (asset) break;
      }
      
      if (!asset) {
        return res.status(404).json({
          message: 'Not Found'
        });
      }
      
      res.json(asset);
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', releases: this.releases.length });
    });
  }

  // Add a release to the mock API
  addRelease(release) {
    // Set default values
    const defaultRelease = {
      id: Date.now() + Math.random(),
      tag_name: release.tag_name || 'v1.0.0',
      name: release.name || release.tag_name || 'v1.0.0',
      body: release.body || 'Test release',
      draft: false,
      prerelease: false,
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      assets: release.assets || [],
      html_url: `https://github.com/notjoeyblack/electron-srt-generator/releases/tag/${release.tag_name}`,
      upload_url: `https://uploads.github.com/repos/notjoeyblack/electron-srt-generator/releases/${Date.now()}/assets`,
      tarball_url: `https://api.github.com/repos/notjoeyblack/electron-srt-generator/tarball/${release.tag_name}`,
      zipball_url: `https://api.github.com/repos/notjoeyblack/electron-srt-generator/zipball/${release.tag_name}`,
      ...release
    };

    // Add to beginning of array (latest first)
    this.releases.unshift(defaultRelease);
    console.log(`[MockGitHubAPI] Added release: ${defaultRelease.tag_name}`);
  }

  // Add an asset to a release
  addAsset(releaseTagName, asset) {
    const release = this.releases.find(r => r.tag_name === releaseTagName);
    if (!release) {
      throw new Error(`Release ${releaseTagName} not found`);
    }

    const defaultAsset = {
      id: Date.now() + Math.random(),
      name: asset.name,
      label: asset.label || asset.name,
      content_type: asset.content_type || 'application/octet-stream',
      size: asset.size || 1024 * 1024, // 1MB default
      download_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      browser_download_url: `http://localhost:${this.port}/repos/notjoeyblack/electron-srt-generator/releases/assets/${Date.now()}`,
      ...asset
    };

    release.assets.push(defaultAsset);
    console.log(`[MockGitHubAPI] Added asset: ${defaultAsset.name} to release ${releaseTagName}`);
  }

  // Clear all releases
  clearReleases() {
    this.releases = [];
    console.log('[MockGitHubAPI] Cleared all releases');
  }

  // Start the server
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[MockGitHubAPI] Server running on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  // Stop the server
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[MockGitHubAPI] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Get server URL
  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }
}

module.exports = MockGitHubAPI;