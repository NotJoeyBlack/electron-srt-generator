import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  AlertTitle,
  Snackbar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Settings as SettingsIcon, Subtitles } from '@mui/icons-material';
import { darkTheme } from './theme/darkTheme';
import { DropZone } from './components/FileUpload/DropZone';
import { FilePicker } from './components/FileUpload/FilePicker';
import { CharacterLimit } from './components/Settings/CharacterLimit';
import { TranscriptionProgress } from './components/Progress/TranscriptionProgress';
import { ResultsDisplay } from './components/Results/ResultsDisplay';
import { useFileUpload } from './hooks/useFileUpload';
import { useTranscription } from './hooks/useTranscription';
import { IPCService } from './services/ipc';
import { AppConfig } from './types';
import './App.css';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [characterLimit, setCharacterLimit] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const fileUpload = useFileUpload();
  const transcription = useTranscription();
  const ipcService = IPCService.getInstance();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('Loading config...');
        const appConfig = await ipcService.getConfig();
        console.log('Config loaded successfully:', appConfig);
        setConfig(appConfig);
        setCharacterLimit(appConfig.default_char_limit);
        setApiKey(appConfig.elevenlabs_api_key);

        // Show settings dialog if API key is not configured
        if (!appConfig.elevenlabs_api_key) {
          setShowSettings(true);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        showMessage(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Fallback to default config
        const defaultConfig = {
          elevenlabs_api_key: '',
          default_char_limit: 30,
          supported_formats: ['.mp3', '.mp4', '.wav', '.m4a', '.mov', '.avi', '.flv', '.mkv', '.webm'],
          output_directory: './output'
        };
        setConfig(defaultConfig);
        setCharacterLimit(defaultConfig.default_char_limit);
        setApiKey(defaultConfig.elevenlabs_api_key);
        setShowSettings(true);
      }
    };

    loadConfig();
  }, [ipcService]);

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const handleStartTranscription = async () => {
    if (!fileUpload.selectedFile) {
      showMessage('Please select a file first');
      return;
    }

    if (!config?.elevenlabs_api_key) {
      showMessage('Please configure your ElevenLabs API key');
      setShowSettings(true);
      return;
    }

    if (!fileUpload.validateFile(fileUpload.selectedFile, config.supported_formats)) {
      return;
    }

    try {
      await transcription.startTranscription({
        filePath: fileUpload.selectedFile.path,
        characterLimit,
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);
      showMessage('Failed to start transcription');
    }
  };

  const handleSaveSettings = async () => {
    console.log('handleSaveSettings called');
    console.log('API Key:', apiKey);
    console.log('Character Limit:', characterLimit);
    
    try {
      console.log('Calling ipcService.saveConfig...');
      await ipcService.saveConfig({
        elevenlabs_api_key: apiKey,
        default_char_limit: characterLimit,
      });
      
      console.log('Settings saved successfully, updating local state...');
      setConfig(prev => prev ? {
        ...prev,
        elevenlabs_api_key: apiKey,
        default_char_limit: characterLimit,
      } : null);
      
      setShowSettings(false);
      showMessage('Settings saved successfully');
      console.log('Save settings completed successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      await ipcService.openFile(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
      showMessage('Failed to open file');
    }
  };

  const handleShowInFolder = async (filePath: string) => {
    try {
      await ipcService.showItemInFolder(filePath);
    } catch (error) {
      console.error('Failed to show file in folder:', error);
      showMessage('Failed to show file in folder');
    }
  };

  const handleRetry = () => {
    transcription.retry();
  };

  const handleNewTranscription = () => {
    fileUpload.reset();
    transcription.reset();
  };

  const isProcessing = transcription.isTranscribing;
  const canStartTranscription = fileUpload.selectedFile && !isProcessing && config?.elevenlabs_api_key;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Subtitles sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                SRT Generator
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Professional subtitle generation powered by ElevenLabs
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(true)}
            sx={{ minWidth: 120 }}
          >
            Settings
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container spacing={3}>
            {/* File Upload Section */}
            <Grid item xs={12} md={8}>
              <Card className="card-hover">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Select Media File
                  </Typography>
                  
                  <DropZone
                    onFileSelect={fileUpload.handleFileSelect}
                    disabled={isProcessing}
                    supportedFormats={config?.supported_formats || []}
                    onError={showMessage}
                  />
                  
                  <Box sx={{ mt: 3 }}>
                    <FilePicker
                      onFileSelect={fileUpload.handleFileSelect}
                      disabled={isProcessing}
                      selectedFile={fileUpload.selectedFile}
                    />
                  </Box>

                  {fileUpload.uploadError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {fileUpload.uploadError}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Settings Section */}
            <Grid item xs={12} md={4}>
              <Card className="card-hover">
                <CardContent sx={{ p: 3 }}>
                  <CharacterLimit
                    value={characterLimit}
                    onChange={setCharacterLimit}
                    disabled={isProcessing}
                  />
                  
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleStartTranscription}
                      disabled={!canStartTranscription}
                      fullWidth
                      sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 600 }}
                    >
                      {isProcessing ? 'Processing...' : 'Generate SRT'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Progress Section */}
            {(transcription.progress || isProcessing) && (
              <Grid item xs={12}>
                <TranscriptionProgress
                  progress={transcription.progress || {
                    stage: 'validation',
                    percentage: 0,
                    message: 'Initializing...'
                  }}
                  isActive={isProcessing}
                  startTime={transcription.startTime || undefined}
                />
              </Grid>
            )}

            {/* Results Section */}
            {transcription.result && (
              <Grid item xs={12}>
                <ResultsDisplay
                  result={transcription.result}
                  onDownload={handleDownload}
                  onShowInFolder={handleShowInFolder}
                  onRetry={handleRetry}
                  processingTime={transcription.processingTime || undefined}
                />
                
                {transcription.result.success && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={handleNewTranscription}
                      sx={{ minWidth: 160 }}
                    >
                      New Transcription
                    </Button>
                  </Box>
                )}
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                label="ElevenLabs API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                fullWidth
                helperText="Get your API key from https://elevenlabs.io/settings"
              />
              
              <Divider />
              
              <CharacterLimit
                value={characterLimit}
                onChange={setCharacterLimit}
              />
              
              {!config?.elevenlabs_api_key && (
                <Alert severity="warning">
                  <AlertTitle>API Key Required</AlertTitle>
                  Please enter your ElevenLabs API key to use the transcription service.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} variant="contained">
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          message={snackbarMessage}
        />
      </Container>
    </ThemeProvider>
  );
}

export default App;