import React from 'react';
import { Button, Box, Typography, Chip } from '@mui/material';
import { FolderOpen, Description, AccessTime } from '@mui/icons-material';
import { FileInfo } from '../../types';

interface FilePickerProps {
  onFileSelect: (file: FileInfo) => void;
  disabled?: boolean;
  selectedFile?: FileInfo | null;
}

export const FilePicker: React.FC<FilePickerProps> = ({ 
  onFileSelect, 
  disabled = false,
  selectedFile 
}) => {
  const handleFileSelect = async () => {
    console.log('FilePicker: handleFileSelect called');
    console.log('FilePicker: disabled =', disabled);
    console.log('FilePicker: window.electronAPI =', window.electronAPI);
    
    if (disabled) {
      console.log('FilePicker: Disabled, returning');
      return;
    }
    
    if (!window.electronAPI) {
      console.error('FilePicker: electronAPI not available');
      return;
    }
    
    try {
      console.log('FilePicker: Calling selectFile...');
      const file = await window.electronAPI.selectFile();
      console.log('FilePicker: selectFile returned:', file);
      if (file) {
        onFileSelect(file);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant="contained"
        size="large"
        startIcon={<FolderOpen />}
        onClick={handleFileSelect}
        disabled={disabled}
        sx={{
          py: 1.5,
          px: 3,
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: 2,
          textTransform: 'none',
          minHeight: 56,
          '&:not(:disabled)': {
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          },
        }}
      >
        {selectedFile ? 'Change File' : 'Browse Files'}
      </Button>

      {selectedFile && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
          className="fade-in"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />
            <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
              {selectedFile.name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={getFileExtension(selectedFile.name).toUpperCase()}
              size="small"
              color="primary"
              variant="filled"
            />
            <Chip
              label={formatFileSize(selectedFile.size)}
              size="small"
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Selected just now
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};