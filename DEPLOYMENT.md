# Automated Update System - Deployment Guide

This guide explains how to use the automated update system for the SRT Generator application.

## Prerequisites

Before you can deploy updates, ensure you have the following installed:

1. **Node.js** (v18+) - https://nodejs.org/
2. **npm** (comes with Node.js)
3. **Git** - https://git-scm.com/
4. **GitHub CLI** - https://cli.github.com/
5. **GitHub account** with repository access

## Setup

### 1. GitHub CLI Authentication

First, authenticate with GitHub CLI:

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### 2. Repository Configuration

Ensure your repository is properly configured:

- Repository must be public or you must have appropriate permissions
- GitHub Actions must be enabled
- Repository must have releases enabled

### 3. Code Signing (Optional but Recommended)

For production applications, you should set up code signing:

**Windows:**
- Obtain a code signing certificate
- Set environment variables: `CSC_LINK` and `CSC_KEY_PASSWORD`

**macOS:**
- Install Xcode and have a valid Apple Developer certificate
- Set environment variables: `CSC_LINK` and `CSC_KEY_PASSWORD`

**Linux:**
- No code signing required for AppImage format

## Deployment Methods

### Method 1: Quick Release (Recommended)

For quick patch releases:

**Windows:**
```cmd
scripts\quick-release.bat
```

**Linux/macOS:**
```bash
./scripts/quick-release.sh
```

This will:
- Bump the patch version (e.g., 1.0.0 → 1.0.1)
- Build the application
- Create installers for all platforms
- Publish to GitHub Releases

### Method 2: Full Deployment

For more control over the deployment process:

**Windows:**
```cmd
scripts\deploy.bat
```

**Linux/macOS:**
```bash
./scripts/deploy.sh
```

This interactive script allows you to:
- Choose version bump type (patch, minor, major, or custom)
- Run all tests and quality checks
- Create and publish releases

### Method 3: Manual NPM Scripts

You can also use the npm scripts directly:

```bash
# Quick patch release
npm run release

# Version bump options
npm run version:patch    # 1.0.0 → 1.0.1
npm run version:minor    # 1.0.0 → 1.1.0
npm run version:major    # 1.0.0 → 2.0.0

# Build and publish
npm run dist:publish
```

## How Updates Work

### For Developers

1. **Version Bump**: When you run a deployment script, it automatically bumps the version in `package.json`
2. **Build**: The application is built for production
3. **Test**: All tests are run to ensure quality
4. **Package**: Installers are created for Windows (NSIS), macOS (DMG), and Linux (AppImage)
5. **Publish**: The release is published to GitHub Releases with all installers attached
6. **Distribution**: The electron-updater system uses GitHub Releases as the update server

### For Users

1. **Auto-Check**: The application automatically checks for updates 5 seconds after startup
2. **Notification**: Users are notified when updates are available
3. **Download**: Users can choose to download updates
4. **Install**: Updates are installed automatically when the application restarts

## Update Flow

```
Developer runs deployment script
           ↓
Version bumped & built
           ↓
Published to GitHub Releases
           ↓
User's app checks for updates
           ↓
Update available notification
           ↓
User downloads & installs
           ↓
App restarts with new version
```

## Configuration

### Update Settings

The update system is configured in `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "notjoeyblack",
      "repo": "electron-srt-generator",
      "releaseType": "release"
    }
  }
}
```

### Update Manager

The update system is handled by `electron/services/updateManager.ts`:

- **Auto-check**: Checks for updates on startup (production only)
- **Manual check**: Users can manually check for updates
- **Progress tracking**: Shows download progress to users
- **Error handling**: Gracefully handles update failures

## Security

The update system includes several security measures:

1. **HTTPS**: All update communications use HTTPS
2. **Signature verification**: Updates are verified against GitHub's signatures
3. **Incremental updates**: Only changed files are downloaded
4. **Rollback capability**: Failed updates can be rolled back
5. **User consent**: Users must approve updates before installation

## Troubleshooting

### Common Issues

**Build fails:**
- Check that all dependencies are installed
- Ensure Node.js version is compatible
- Verify TypeScript compilation passes

**GitHub authentication fails:**
- Run `gh auth login` and re-authenticate
- Check that GitHub CLI is properly installed

**Code signing fails:**
- Ensure certificates are properly configured
- Check environment variables are set correctly

**Updates not detected:**
- Verify the application is built and packaged properly
- Check that GitHub Releases are public and accessible
- Ensure the repository and owner names match in configuration

### Debug Mode

To debug update issues:

1. Enable debug logging in the UpdateManager
2. Check the application logs in the user's system
3. Verify GitHub Releases are properly formatted
4. Test with development builds first

## Environment Variables

You can set these environment variables for customization:

```bash
# Code signing (optional)
CSC_LINK="path/to/certificate.p12"
CSC_KEY_PASSWORD="certificate-password"

# GitHub token (usually not needed with GitHub CLI)
GH_TOKEN="your-github-token"

# Debug mode
DEBUG_PROD=true
```

## Best Practices

1. **Test thoroughly**: Always test updates in a development environment first
2. **Version semantics**: Use semantic versioning (major.minor.patch)
3. **Release notes**: Include meaningful release notes for users
4. **Backup**: Keep backups of working versions
5. **Monitor**: Monitor update success rates and user feedback
6. **Gradual rollout**: Consider rolling out updates to a subset of users first

## Support

For issues with the update system:

1. Check the application logs
2. Verify GitHub Releases are accessible
3. Test with a fresh installation
4. Check network connectivity and firewall settings
5. Review this documentation for configuration issues

The automated update system provides a seamless experience for both developers and users, ensuring that the SRT Generator application stays up-to-date with the latest features and security improvements.