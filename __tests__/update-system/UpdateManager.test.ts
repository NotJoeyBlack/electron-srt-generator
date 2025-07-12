import { UpdateManager, UpdateStatus, UpdateInfo, UpdateProgress } from '../../electron/services/updateManager';
import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    isPackaged: true
  },
  BrowserWindow: jest.fn(),
  dialog: {
    showMessageBox: jest.fn()
  }
}));

jest.mock('electron-updater', () => ({
  autoUpdater: mockDeep<typeof autoUpdater>()
}));

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  transports: {
    file: {
      level: 'info'
    }
  }
}));

describe('UpdateManager', () => {
  let updateManager: UpdateManager;
  let mockWindow: any;
  let mockAutoUpdater: any;

  beforeEach(() => {
    mockReset(autoUpdater);
    mockAutoUpdater = autoUpdater as any;
    
    // Mock BrowserWindow
    mockWindow = {
      webContents: {
        send: jest.fn()
      }
    };
    
    // Reset auto updater mock
    mockAutoUpdater.logger = null;
    mockAutoUpdater.setFeedURL = jest.fn();
    mockAutoUpdater.checkForUpdates = jest.fn();
    mockAutoUpdater.downloadUpdate = jest.fn();
    mockAutoUpdater.quitAndInstall = jest.fn();
    mockAutoUpdater.on = jest.fn();
    mockAutoUpdater.autoDownload = false;
    mockAutoUpdater.autoInstallOnAppQuit = true;
    mockAutoUpdater.allowDowngrade = false;
    mockAutoUpdater.allowPrerelease = false;
    
    updateManager = new UpdateManager();
  });

  describe('constructor', () => {
    it('should initialize with default update status', () => {
      const status = updateManager.getUpdateStatus();
      expect(status).toEqual({
        checking: false,
        available: false,
        downloading: false,
        downloaded: false
      });
    });

    it('should configure electron-updater', () => {
      expect(mockAutoUpdater.setFeedURL).toHaveBeenCalledWith({
        provider: 'github',
        owner: 'notjoeyblack',
        repo: 'electron-srt-generator',
        private: false,
        releaseType: 'release'
      });
      expect(mockAutoUpdater.autoDownload).toBe(false);
      expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true);
      expect(mockAutoUpdater.allowDowngrade).toBe(false);
      expect(mockAutoUpdater.allowPrerelease).toBe(false);
    });

    it('should set up event listeners', () => {
      expect(mockAutoUpdater.on).toHaveBeenCalledTimes(5);
      expect(mockAutoUpdater.on).toHaveBeenCalledWith('checking-for-update', expect.any(Function));
      expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function));
      expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-not-available', expect.any(Function));
      expect(mockAutoUpdater.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockAutoUpdater.on).toHaveBeenCalledWith('download-progress', expect.any(Function));
      expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function));
    });
  });

  describe('setMainWindow', () => {
    it('should set the main window', () => {
      updateManager.setMainWindow(mockWindow);
      // No direct way to test this, but we can verify it works by checking if events are sent
    });
  });

  describe('checkForUpdates', () => {
    beforeEach(() => {
      updateManager.setMainWindow(mockWindow);
    });

    it('should call autoUpdater.checkForUpdates', async () => {
      mockAutoUpdater.checkForUpdates.mockResolvedValue({});
      
      await updateManager.checkForUpdates();
      
      expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should handle errors during update check', async () => {
      const error = new Error('Network error');
      mockAutoUpdater.checkForUpdates.mockRejectedValue(error);
      
      await updateManager.checkForUpdates();
      
      const status = updateManager.getUpdateStatus();
      expect(status.error).toBe('Network error');
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('update-status', expect.objectContaining({
        error: 'Network error'
      }));
    });
  });

  describe('downloadUpdate', () => {
    beforeEach(() => {
      updateManager.setMainWindow(mockWindow);
    });

    it('should call autoUpdater.downloadUpdate', async () => {
      mockAutoUpdater.downloadUpdate.mockResolvedValue({});
      
      await updateManager.downloadUpdate();
      
      expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalled();
    });

    it('should handle errors during download', async () => {
      const error = new Error('Download failed');
      mockAutoUpdater.downloadUpdate.mockRejectedValue(error);
      
      await updateManager.downloadUpdate();
      
      const status = updateManager.getUpdateStatus();
      expect(status.error).toBe('Download failed');
    });
  });

  describe('quitAndInstall', () => {
    it('should call autoUpdater.quitAndInstall', () => {
      updateManager.quitAndInstall();
      expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    let eventHandlers: { [key: string]: Function };

    beforeEach(() => {
      updateManager.setMainWindow(mockWindow);
      
      // Extract event handlers from the on() calls
      eventHandlers = {};
      mockAutoUpdater.on.mock.calls.forEach(([event, handler]) => {
        eventHandlers[event] = handler;
      });
    });

    describe('checking-for-update', () => {
      it('should update status when checking for updates', () => {
        eventHandlers['checking-for-update']();
        
        const status = updateManager.getUpdateStatus();
        expect(status.checking).toBe(true);
        expect(status.error).toBeUndefined();
        expect(mockWindow.webContents.send).toHaveBeenCalledWith('update-status', expect.objectContaining({
          checking: true
        }));
      });
    });

    describe('update-available', () => {
      it('should update status when update is available', () => {
        const updateInfo = {
          version: '1.2.0',
          releaseDate: '2023-01-01',
          releaseName: 'Version 1.2.0',
          releaseNotes: 'Bug fixes and improvements'
        };
        
        eventHandlers['update-available'](updateInfo);
        
        const status = updateManager.getUpdateStatus();
        expect(status.checking).toBe(false);
        expect(status.available).toBe(true);
        expect(status.info).toEqual({
          version: '1.2.0',
          releaseDate: '2023-01-01',
          releaseName: 'Version 1.2.0',
          releaseNotes: 'Bug fixes and improvements'
        });
      });

      it('should handle null release notes', () => {
        const updateInfo = {
          version: '1.2.0',
          releaseDate: '2023-01-01',
          releaseName: 'Version 1.2.0',
          releaseNotes: null
        };
        
        eventHandlers['update-available'](updateInfo);
        
        const status = updateManager.getUpdateStatus();
        expect(status.info?.releaseNotes).toBeUndefined();
      });
    });

    describe('update-not-available', () => {
      it('should update status when no update is available', () => {
        const info = { version: '1.0.0' };
        
        eventHandlers['update-not-available'](info);
        
        const status = updateManager.getUpdateStatus();
        expect(status.checking).toBe(false);
        expect(status.available).toBe(false);
      });
    });

    describe('error', () => {
      it('should update status when error occurs', () => {
        const error = new Error('Update failed');
        
        eventHandlers['error'](error);
        
        const status = updateManager.getUpdateStatus();
        expect(status.checking).toBe(false);
        expect(status.downloading).toBe(false);
        expect(status.error).toBe('Update failed');
      });
    });

    describe('download-progress', () => {
      it('should update progress during download', () => {
        const progressInfo = {
          bytesPerSecond: 1000000,
          percent: 50,
          transferred: 25000000,
          total: 50000000
        };
        
        eventHandlers['download-progress'](progressInfo);
        
        const status = updateManager.getUpdateStatus();
        expect(status.downloading).toBe(true);
        expect(status.progress).toEqual(progressInfo);
      });
    });

    describe('update-downloaded', () => {
      it('should update status when download is complete', () => {
        const info = {
          version: '1.2.0',
          releaseDate: '2023-01-01'
        };
        
        eventHandlers['update-downloaded'](info);
        
        const status = updateManager.getUpdateStatus();
        expect(status.downloading).toBe(false);
        expect(status.downloaded).toBe(true);
        expect(status.progress).toBeUndefined();
      });
    });
  });

  describe('utility methods', () => {
    it('should format download speed correctly', () => {
      const speed = updateManager.formatDownloadSpeed(1048576); // 1MB/s
      expect(speed).toBe('1 MB/s');
    });

    it('should calculate estimated time remaining', () => {
      const progress: UpdateProgress = {
        bytesPerSecond: 1000000, // 1MB/s
        percent: 50,
        transferred: 25000000, // 25MB
        total: 50000000 // 50MB
      };
      
      const timeRemaining = updateManager.getEstimatedTimeRemaining(progress);
      expect(timeRemaining).toBe('25s');
    });

    it('should handle zero speed in time calculation', () => {
      const progress: UpdateProgress = {
        bytesPerSecond: 0,
        percent: 50,
        transferred: 25000000,
        total: 50000000
      };
      
      const timeRemaining = updateManager.getEstimatedTimeRemaining(progress);
      expect(timeRemaining).toBe('Calculating...');
    });
  });

  describe('scheduleAutoCheck', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      updateManager.setMainWindow(mockWindow);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule automatic update check', () => {
      const checkForUpdatesSpy = jest.spyOn(updateManager, 'checkForUpdates');
      
      updateManager.scheduleAutoCheck();
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      expect(checkForUpdatesSpy).toHaveBeenCalled();
    });
  });
});