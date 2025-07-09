import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Fade } from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import { FileInfo } from '../../types';

interface DropZoneProps {
  onFileSelect: (file: FileInfo) => void;
  disabled?: boolean;
  supportedFormats: string[];
  onError?: (error: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  onFileSelect, 
  disabled = false, 
  supportedFormats,
  onError
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    console.log('handleDragEnter called');
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
      console.log('Drag over activated');
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    console.log('handleDragLeave called');
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(false);
      setIsDragActive(false);
      console.log('Drag states reset');
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    console.log('handleDragOver called');
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
      console.log('Drag active');
    }
  }, [disabled]);

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    console.log('Validating file:', file.name, 'Extension:', extension);
    console.log('Supported formats:', supportedFormats);
    const isValid = supportedFormats.includes(extension);
    console.log('File validation result:', isValid);
    return isValid;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    console.log('handleDrop called');
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) {
      console.log('Drop disabled');
      return;
    }
    
    setIsDragOver(false);
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files.length);
    
    if (files.length === 0) {
      console.log('No files dropped');
      return;
    }
    
    if (files.length > 1) {
      console.log('Multiple files dropped, using first file');
      onError?.('Please drop only one file at a time. Using the first file.');
    }
    
    const file = files[0];
    console.log('Processing file:', file.name, 'Type:', file.type);
    
    if (!validateFile(file)) {
      console.error('Unsupported file format:', file.name);
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      onError?.(`File format ${extension} is not supported. Please use: ${supportedFormats.join(', ')}`);
      return;
    }

    // In Electron, File objects have a path property
    const electronFile = file as File & { path?: string };
    const fileInfo: FileInfo = {
      name: file.name,
      path: electronFile.path || file.name, // Use file name as fallback
      size: file.size,
      type: file.type
    };
    
    console.log('Calling onFileSelect with:', fileInfo);
    onFileSelect(fileInfo);
  }, [disabled, onFileSelect, supportedFormats, onError, validateFile]);

  const formatList = supportedFormats.map(format => format.toUpperCase().replace('.', '')).join(', ');

  return (
    <Box
      className={`drag-zone ${isDragOver ? 'drag-over' : ''} ${isDragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        padding: 4,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isDragActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        '&:hover': {
          borderColor: disabled ? 'divider' : 'primary.main',
          backgroundColor: disabled ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
        },
      }}
    >
      <Fade in={true}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <IconButton
            size="large"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              width: 80,
              height: 80,
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
            disabled={disabled}
          >
            {isDragActive ? (
              <InsertDriveFile sx={{ fontSize: 40 }} />
            ) : (
              <CloudUpload sx={{ fontSize: 40 }} />
            )}
          </IconButton>
          
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
            {isDragActive ? 'Drop your file here' : 'Drag & drop your media file here'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            or click the button below to browse files
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Supported formats: {formatList}
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};