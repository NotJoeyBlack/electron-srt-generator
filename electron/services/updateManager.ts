import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater, UpdateInfo as ElectronUpdaterInfo, ProgressInfo } from 'electron-updater';
import log from 'electron-log';
import * as path from 'path';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error?: string;
  info?: UpdateInfo;
  progress?: UpdateProgress;
}

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false
  };

  constructor() {
    this.setupUpdater();
    this.setupEventListeners();
  }

  private setupUpdater(): void {
    // Configure electron-updater
    autoUpdater.logger = log;
    if (autoUpdater.logger) {
      (autoUpdater.logger as any).transports.file.level = 'info';
    }
    
    // Set update server URL (GitHub Releases)
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'notjoeyblack', // Replace with your GitHub username
      repo: 'electron-srt-generator', // Replace with your repo name
      private: false,
      releaseType: 'release'
    });

    // Configure update behavior
    autoUpdater.autoDownload = false; // We'll handle download manually
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;
  }

  private setupEventListeners(): void {
    // Update checking started
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.updateStatus.checking = true;
      this.updateStatus.error = undefined;
      this.sendUpdateStatus();
    });

    // Update available
    autoUpdater.on('update-available', (info: ElectronUpdaterInfo) => {
      log.info('Update available:', info);
      this.updateStatus.checking = false;
      this.updateStatus.available = true;
      this.updateStatus.info = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseName: info.releaseName || undefined,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined
      };
      this.sendUpdateStatus();
      this.showUpdateAvailableDialog(info);
    });

    // No update available
    autoUpdater.on('update-not-available', (info: ElectronUpdaterInfo) => {
      log.info('Update not available:', info);
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.sendUpdateStatus();
    });

    // Update error
    autoUpdater.on('error', (error: Error) => {
      log.error('Update error:', error);
      this.updateStatus.checking = false;
      this.updateStatus.downloading = false;
      this.updateStatus.error = error.message;
      this.sendUpdateStatus();
      this.showUpdateErrorDialog(error);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      log.info('Download progress:', progressObj);
      this.updateStatus.downloading = true;
      this.updateStatus.progress = {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total
      };
      this.sendUpdateStatus();
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info: ElectronUpdaterInfo) => {
      log.info('Update downloaded:', info);
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.updateStatus.progress = undefined;
      this.sendUpdateStatus();
      this.showUpdateDownloadedDialog(info);
    });
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  public async checkForUpdates(): Promise<void> {
    try {
      log.info('Manually checking for updates...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Error checking for updates:', error);
      this.updateStatus.error = error instanceof Error ? error.message : 'Unknown error';
      this.sendUpdateStatus();
    }
  }

  public async downloadUpdate(): Promise<void> {
    try {
      log.info('Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
      this.updateStatus.error = error instanceof Error ? error.message : 'Unknown error';
      this.sendUpdateStatus();
    }
  }

  public quitAndInstall(): void {
    log.info('Quitting and installing update...');
    autoUpdater.quitAndInstall();
  }

  public getUpdateStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  private sendUpdateStatus(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-status', this.updateStatus);
    }
  }

  private showUpdateAvailableDialog(info: ElectronUpdaterInfo): void {
    if (!this.mainWindow) return;

    const message = `A new version (${info.version}) is available!\n\nWould you like to download it now?`;
    
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message,
      detail: typeof info.releaseNotes === 'string' ? info.releaseNotes : 'No release notes available.',
      buttons: ['Download Now', 'Later', 'Skip This Version'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        this.downloadUpdate();
      } else if (result.response === 2) {
        // Skip this version
        log.info('User chose to skip version:', info.version);
      }
    });
  }

  private showUpdateDownloadedDialog(info: ElectronUpdaterInfo): void {
    if (!this.mainWindow) return;

    const message = `Update (${info.version}) has been downloaded!\n\nRestart now to apply the update?`;
    
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        this.quitAndInstall();
      }
    });
  }

  private showUpdateErrorDialog(error: Error): void {
    if (!this.mainWindow) return;

    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Update Error',
      message: 'Failed to check for updates',
      detail: error.message,
      buttons: ['OK'],
      defaultId: 0
    });
  }

  // Auto-check for updates on startup (after a delay)
  public scheduleAutoCheck(): void {
    setTimeout(() => {
      if (app.isPackaged) { // Only check in production
        this.checkForUpdates();
      }
    }, 5000); // Check 5 seconds after startup
  }

  // Format bytes for display
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format download speed
  public formatDownloadSpeed(bytesPerSecond: number): string {
    return `${this.formatBytes(bytesPerSecond)}/s`;
  }

  // Get estimated time remaining
  public getEstimatedTimeRemaining(progress: UpdateProgress): string {
    if (progress.bytesPerSecond === 0) return 'Calculating...';
    
    const remaining = progress.total - progress.transferred;
    const seconds = remaining / progress.bytesPerSecond;
    
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.ceil(seconds / 3600);
      return `${hours}h`;
    }
  }
}