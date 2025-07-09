import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Divider,
  Chip,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import { 
  Download, 
  FolderOpen, 
  CheckCircle, 
  Error as ErrorIcon,
  Refresh,
  Info
} from '@mui/icons-material';
import { TranscriptionResponse } from '../../types';

interface ResultsDisplayProps {
  result: TranscriptionResponse;
  onDownload?: (filePath: string) => void;
  onShowInFolder?: (filePath: string) => void;
  onRetry?: () => void;
  processingTime?: number;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  result, 
  onDownload, 
  onShowInFolder, 
  onRetry,
  processingTime 
}) => {
  const handleDownload = () => {
    if (result.srtPath && onDownload) {
      onDownload(result.srtPath);
    }
  };

  const handleShowInFolder = () => {
    if (result.srtPath && onShowInFolder) {
      onShowInFolder(result.srtPath);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getFileName = (filePath: string): string => {
    return filePath.split(/[\\/]/).pop() || 'subtitle.srt';
  };

  if (result.success) {
    return (
      <Fade in={true}>
        <Card className="card-hover success-animation">
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CheckCircle color="success" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Transcription Successful
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your SRT file has been generated successfully
                </Typography>
              </Box>
            </Box>

            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>File Ready</AlertTitle>
              Your subtitle file has been created and is ready for download.
            </Alert>

            {result.srtPath && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Generated File:
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography variant="body1" sx={{ flex: 1, fontFamily: 'monospace' }}>
                    {getFileName(result.srtPath)}
                  </Typography>
                  <Chip label="SRT" size="small" color="success" />
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {processingTime && (
                <Chip
                  label={`Completed in ${formatTime(processingTime)}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              <Chip
                label="Ready for use"
                size="small"
                color="success"
                variant="filled"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownload}
                disabled={!result.srtPath}
                sx={{ minWidth: 140 }}
              >
                Open File
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FolderOpen />}
                onClick={handleShowInFolder}
                disabled={!result.srtPath}
                sx={{ minWidth: 140 }}
              >
                Show in Folder
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  }

  // Error case
  return (
    <Fade in={true}>
      <Card className="card-hover error-shake">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ErrorIcon color="error" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                Transcription Failed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                An error occurred during processing
              </Typography>
            </Box>
          </Box>

          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {result.error || 'An unknown error occurred'}
          </Alert>

          {result.troubleshooting && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Troubleshooting</AlertTitle>
              {result.troubleshooting}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip
              label="Processing failed"
              size="small"
              color="error"
              variant="filled"
            />
            {processingTime && (
              <Chip
                label={`Failed after ${formatTime(processingTime)}`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRetry}
              sx={{ minWidth: 120 }}
            >
              Try Again
            </Button>
            
            <Tooltip title="Check your API key, internet connection, and file format">
              <IconButton color="info">
                <Info />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};