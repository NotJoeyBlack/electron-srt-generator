import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  SystemUpdate,
  Download,
  CheckCircle,
  Error as ErrorIcon,
  RestartAlt
} from '@mui/icons-material';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error?: string;
  info?: UpdateInfo;
  progress?: UpdateProgress;
}

interface UpdateManagerProps {
  onUpdateInstall?: () => void;
}

const UpdateManager: React.FC<UpdateManagerProps> = ({ onUpdateInstall }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showUpdateAvailable, setShowUpdateAvailable] = useState(false);
  const [showUpdateDownloaded, setShowUpdateDownloaded] = useState(false);

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    // Listen for update status changes
    electronAPI.onUpdateStatus((status: UpdateStatus) => {
      setUpdateStatus(status);
      
      // Show update available dialog
      if (status.available && !status.downloading && !status.downloaded) {
        setShowUpdateAvailable(true);
      }
      
      // Show update downloaded dialog
      if (status.downloaded) {
        setShowUpdateDownloaded(true);
      }
    });

    // Get initial update status
    electronAPI.getUpdateStatus().then((status: UpdateStatus) => {
      setUpdateStatus(status);
    });
  }, []);

  const handleCheckForUpdates = async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    try {
      await electronAPI.checkForUpdates();
      setDialogOpen(true);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleDownloadUpdate = async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    try {
      await electronAPI.downloadUpdate();
      setShowUpdateAvailable(false);
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const handleInstallUpdate = async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    try {
      onUpdateInstall?.();
      await electronAPI.installUpdate();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const getEstimatedTimeRemaining = (progress: UpdateProgress): string => {
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
  };

  const getStatusText = (): string => {
    if (updateStatus.checking) return 'Checking for updates...';
    if (updateStatus.downloading) return 'Downloading update...';
    if (updateStatus.downloaded) return 'Update ready to install';
    if (updateStatus.available) return 'Update available';
    if (updateStatus.error) return 'Update error';
    return 'No updates available';
  };

  const getStatusIcon = () => {
    if (updateStatus.checking) return <CircularProgress size={20} />;
    if (updateStatus.downloading) return <Download />;
    if (updateStatus.downloaded) return <CheckCircle color="success" />;
    if (updateStatus.available) return <SystemUpdate color="primary" />;
    if (updateStatus.error) return <ErrorIcon color="error" />;
    return <CheckCircle color="success" />;
  };

  const getStatusColor = () => {
    if (updateStatus.error) return 'error';
    if (updateStatus.available || updateStatus.downloading) return 'info';
    if (updateStatus.downloaded) return 'success';
    return 'default';
  };

  return (
    <>
      {/* Update Status Button */}
      <Button
        variant="outlined"
        startIcon={getStatusIcon()}
        onClick={handleCheckForUpdates}
        disabled={updateStatus.checking || updateStatus.downloading}
      >
        Check for Updates
      </Button>

      {/* Update Status Chip */}
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor() as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
        size="small"
        sx={{ ml: 1 }}
      />

      {/* Update Available Dialog */}
      <Dialog
        open={showUpdateAvailable}
        onClose={() => setShowUpdateAvailable(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SystemUpdate color="primary" />
            Update Available
          </Box>
        </DialogTitle>
        <DialogContent>
          {updateStatus.info && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Version {updateStatus.info.version}
              </Typography>
              {updateStatus.info.releaseName && (
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {updateStatus.info.releaseName}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Released: {new Date(updateStatus.info.releaseDate).toLocaleDateString()}
              </Typography>
              {updateStatus.info.releaseNotes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Release Notes:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {updateStatus.info.releaseNotes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateAvailable(false)}>
            Later
          </Button>
          <Button onClick={handleDownloadUpdate} variant="contained" autoFocus>
            Download Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Downloaded Dialog */}
      <Dialog
        open={showUpdateDownloaded}
        onClose={() => setShowUpdateDownloaded(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Update Ready
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Update {updateStatus.info?.version} has been downloaded and is ready to install.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The application will restart to apply the update.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDownloaded(false)}>
            Later
          </Button>
          <Button
            onClick={handleInstallUpdate}
            variant="contained"
            startIcon={<RestartAlt />}
            autoFocus
          >
            Restart & Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon()}
            Update Status
          </Box>
        </DialogTitle>
        <DialogContent>
          {updateStatus.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatus.error}
            </Alert>
          )}
          
          {updateStatus.checking && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              <Typography>Checking for updates...</Typography>
            </Box>
          )}

          {updateStatus.downloading && updateStatus.progress && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Downloading update... {updateStatus.progress.percent.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={updateStatus.progress.percent}
                sx={{ mb: 1 }}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">
                  {formatBytes(updateStatus.progress.transferred)} / {formatBytes(updateStatus.progress.total)}
                </Typography>
                <Typography variant="caption">
                  {formatSpeed(updateStatus.progress.bytesPerSecond)} • {getEstimatedTimeRemaining(updateStatus.progress)}
                </Typography>
              </Box>
            </Box>
          )}

          {!updateStatus.checking && !updateStatus.downloading && !updateStatus.available && !updateStatus.error && (
            <Typography>Your application is up to date!</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UpdateManager;