import { useState, useCallback, useEffect } from 'react';
import { TranscriptionRequest, TranscriptionResponse, ProgressUpdate } from '../types';

export const useTranscription = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const startTranscription = useCallback(async (request: TranscriptionRequest) => {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      setIsTranscribing(false);
      setResult({
        success: false,
        error: 'Transcription not available in development mode',
        troubleshooting: 'Please run "npm run build" and then "npm run electron" to use the full Electron app with transcription capabilities.'
      });
      return;
    }

    setIsTranscribing(true);
    setProgress(null);
    setResult(null);
    setStartTime(new Date());
    setProcessingTime(null);

    try {
      await window.electronAPI.startTranscription(request);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      setIsTranscribing(false);
      setResult({
        success: false,
        error: 'Failed to start transcription process',
        troubleshooting: 'Please check your internet connection and try again.'
      });
    }
  }, []);

  const retry = useCallback(() => {
    setResult(null);
    setProgress(null);
    setProcessingTime(null);
  }, []);

  const reset = useCallback(() => {
    setIsTranscribing(false);
    setProgress(null);
    setResult(null);
    setStartTime(null);
    setProcessingTime(null);
  }, []);

  const calculateProcessingTime = useCallback((start: Date): number => {
    return (Date.now() - start.getTime()) / 1000;
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleProgress = (progressUpdate: ProgressUpdate) => {
      setProgress(progressUpdate);
    };

    const handleComplete = (response: TranscriptionResponse) => {
      setIsTranscribing(false);
      setResult(response);
      
      if (startTime) {
        setProcessingTime(calculateProcessingTime(startTime));
      }
    };

    const handleError = (error: string, troubleshooting?: string) => {
      setIsTranscribing(false);
      setResult({
        success: false,
        error,
        troubleshooting
      });
      
      if (startTime) {
        setProcessingTime(calculateProcessingTime(startTime));
      }
    };

    // Register event listeners
    window.electronAPI.onProgress(handleProgress);
    window.electronAPI.onComplete(handleComplete);
    window.electronAPI.onError(handleError);

    // Cleanup function
    return () => {
      // Note: In a real implementation, you might want to remove event listeners
      // For now, we'll just clean up local state
    };
  }, [startTime, calculateProcessingTime]);

  return {
    isTranscribing,
    progress,
    result,
    startTime,
    processingTime,
    startTranscription,
    retry,
    reset,
  };
};