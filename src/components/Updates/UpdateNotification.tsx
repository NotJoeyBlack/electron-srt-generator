import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Slide,
  SlideProps
} from '@mui/material';
import {
  Close,
  Download,
  RestartAlt
} from '@mui/icons-material';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error?: string;
  info?: UpdateInfo;
}

interface UpdateNotificationProps {
  onUpdateAction?: (action: 'download' | 'install' | 'dismiss') => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdateAction }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'available' | 'downloaded' | 'error'>('available');

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    electronAPI.onUpdateStatus((status: UpdateStatus) => {
      setUpdateStatus(status);
      
      // Show notification for update available
      if (status.available && !status.downloading && !status.downloaded) {
        setNotificationType('available');
        setShowNotification(true);
      }
      
      // Show notification for update downloaded
      if (status.downloaded) {
        setNotificationType('downloaded');
        setShowNotification(true);
      }
      
      // Show notification for errors
      if (status.error) {
        setNotificationType('error');
        setShowNotification(true);
      }
    });
  }, []);

  const handleDownload = async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    try {
      await electronAPI.downloadUpdate();
      onUpdateAction?.('download');
      setShowNotification(false);
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const handleInstall = async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    try {
      onUpdateAction?.('install');
      await electronAPI.installUpdate();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    onUpdateAction?.('dismiss');
  };

  const getNotificationContent = () => {
    switch (notificationType) {
      case 'available':
        return {
          severity: 'info' as const,
          title: 'Update Available',
          message: `Version ${updateStatus.info?.version || 'unknown'} is available`,
          action: (
            <Button
              color="inherit"
              size="small"
              onClick={handleDownload}
              startIcon={<Download />}
            >
              Download
            </Button>
          )
        };
      
      case 'downloaded':
        return {
          severity: 'success' as const,
          title: 'Update Ready',
          message: 'Update has been downloaded and is ready to install',
          action: (
            <Button
              color="inherit"
              size="small"
              onClick={handleInstall}
              startIcon={<RestartAlt />}
            >
              Restart & Install
            </Button>
          )
        };
      
      case 'error':
        return {
          severity: 'error' as const,
          title: 'Update Error',
          message: updateStatus.error || 'An error occurred while updating',
          action: null
        };
      
      default:
        return {
          severity: 'info' as const,
          title: 'Update',
          message: 'Update notification',
          action: null
        };
    }
  };

  const content = getNotificationContent();

  return (
    <Snackbar
      open={showNotification}
      autoHideDuration={notificationType === 'error' ? 10000 : 30000}
      onClose={handleDismiss}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity={content.severity}
        onClose={handleDismiss}
        action={
          <>
            {content.action}
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <Close fontSize="inherit" />
            </IconButton>
          </>
        }
        sx={{ 
          minWidth: 350,
          '& .MuiAlert-message': {
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }
        }}
      >
        <AlertTitle>{content.title}</AlertTitle>
        {content.message}
      </Alert>
    </Snackbar>
  );
};

export default UpdateNotification;