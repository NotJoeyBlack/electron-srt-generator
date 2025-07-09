import { useState, useCallback } from 'react';
import { FileInfo } from '../types';

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: FileInfo) => {
    console.log('useFileUpload.handleFileSelect called with:', file);
    setSelectedFile(file);
    setUploadError(null);
    console.log('File selected successfully');
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
  }, []);

  const setUploading = useCallback((uploading: boolean) => {
    setIsUploading(uploading);
  }, []);

  const setError = useCallback((error: string | null) => {
    setUploadError(error);
  }, []);

  const validateFile = useCallback((file: FileInfo, supportedFormats: string[]): boolean => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(`.${extension}`)) {
      setError(`Unsupported file format: ${extension?.toUpperCase() || 'unknown'}`);
      return false;
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 100MB.');
      return false;
    }

    // Check if file size is reasonable (not empty)
    if (file.size === 0) {
      setError('File appears to be empty.');
      return false;
    }

    return true;
  }, [setError]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadError(null);
  }, []);

  return {
    selectedFile,
    isUploading,
    uploadError,
    handleFileSelect,
    clearFile,
    setUploading,
    setError,
    validateFile,
    reset,
  };
};