# SRT Generator Desktop Application

A professional, high-performance desktop application for generating SRT subtitle files from audio and video files using ElevenLabs Speech-to-Text API. Built with Electron, React, TypeScript, and Material-UI.

## Features

### Core Functionality
- **Audio/Video to SRT Conversion**: Convert media files to SRT subtitle format
- **ElevenLabs Integration**: Powered by ElevenLabs `scribe_v1` model for high-quality transcription
- **Timing Adjustment**: Automatic timing optimization for better subtitle flow
- **Speaker Diarization**: Identifies and labels different speakers in the audio
- **Character Limit Control**: Configurable character limits per subtitle line

### User Interface
- **Modern Dark Theme**: Purple accent color scheme with Material-UI components
- **Drag & Drop**: Intuitive file upload with drag and drop support
- **File Picker**: Traditional file browser option
- **Real-time Progress**: Visual progress tracking with detailed status updates
- **Error Handling**: Comprehensive error messages with troubleshooting guidance

### Technical Features
- **Cross-platform**: Windows, macOS, and Linux support
- **TypeScript**: Full type safety throughout the application
- **Secure Architecture**: Context isolation and sandboxed renderers
- **IPC Communication**: Secure main-renderer process communication
- **Configuration Management**: Persistent settings storage

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- ElevenLabs API key (get from [ElevenLabs Settings](https://elevenlabs.io/settings))

### Setup
1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   cd electron-srt-generator
   npm install
   ```

3. **Configure API Key**:
   - Launch the application
   - Click "Settings" in the top right
   - Enter your ElevenLabs API key
   - Save settings

### Verification
After installation, you can verify everything is working correctly:

```bash
# Run tests
npm test

# Run type checking
npm run typecheck

# Build the application
npm run build
```

All commands should complete without errors.

## Usage

### Running the Application

#### Development Mode
```bash
npm run dev
```
This starts both the React development server and Electron application.

#### Production Build
```bash
npm run build
npm run dist
```

### Using the Application

1. **Select Media File**:
   - Drag and drop a media file onto the upload area, or
   - Click "Browse Files" to select a file

2. **Configure Settings**:
   - Adjust character limit per subtitle line (10-200 characters)
   - Default is 50 characters for optimal readability

3. **Generate SRT**:
   - Click "Generate SRT" to start transcription
   - Monitor progress through the visual progress indicator
   - Wait for completion (processing time varies by file size)

4. **Download Results**:
   - Click "Open File" to view the generated SRT file
   - Click "Show in Folder" to locate the file in your file system

### Supported File Formats
- **Audio**: MP3, WAV, M4A
- **Video**: MP4, MOV, AVI, FLV, MKV, WEBM

## Configuration

### Settings
- **ElevenLabs API Key**: Required for transcription service
- **Character Limit**: Controls subtitle line length (10-200 characters)
- **Output Directory**: Defaults to "Documents/SRT Generator Output"

### File Locations
- **Config File**: Stored in application data directory
- **Output Files**: Default to Documents folder, customizable in settings

## Development

### Project Structure
```
electron-srt-generator/
├── src/                    # React application source
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # IPC communication services
│   ├── theme/             # Material-UI theme configuration
│   └── types/             # TypeScript type definitions
├── electron/              # Electron main process
│   ├── services/          # Backend services
│   ├── utils/             # Utility functions
│   ├── main.ts            # Main process entry point
│   └── preload.ts         # Secure IPC bridge
├── public/                # Static files
└── build/                 # Production build output
```

### Available Scripts
- `npm run dev` - Start development environment
- `npm run build` - Build for production
- `npm run dist` - Create distributable packages
- `npm run pack` - Create unpacked distribution

### Architecture Overview

#### Main Process (Electron)
- **File Processing**: Validates and handles media files
- **ElevenLabs Integration**: API communication and transcription
- **SRT Processing**: Timing adjustment and formatting
- **Configuration Management**: Persistent settings storage

#### Renderer Process (React)
- **User Interface**: Material-UI components with dark theme
- **File Upload**: Drag & drop and file picker functionality
- **Progress Tracking**: Real-time status updates
- **Results Display**: Download and file management

#### IPC Communication
- **Secure Bridge**: Preload script for safe communication
- **Event-driven**: Progress updates and error handling
- **Type-safe**: Full TypeScript support

## Troubleshooting

### Common Issues

#### "Invalid API Key"
- Verify your ElevenLabs API key is correct
- Check that your API key has sufficient credits
- Ensure your API key has Speech-to-Text permissions

#### "File Too Large"
- Maximum file size is 100MB
- Consider compressing large files before upload
- Use shorter audio/video clips for testing

#### "Unsupported File Format"
- Ensure file extension is supported
- Try converting to MP3 or MP4 format
- Check that the file is not corrupted

#### "Network Error"
- Verify internet connection
- Check firewall settings allow HTTPS to elevenlabs.io
- Try again after a few minutes

#### "Processing Failed"
- Check file integrity (not corrupted)
- Ensure sufficient system resources
- Try with a smaller file first

### Performance Tips
- Use compressed audio formats (MP3) for faster processing
- Shorter files (under 10 minutes) process more quickly
- Close other applications during processing for optimal performance

## Distribution

### Building for Distribution
```bash
npm run build
npm run dist
```

### Supported Platforms
- **Windows**: Creates NSIS installer (.exe)
- **macOS**: Creates DMG installer
- **Linux**: Creates AppImage package

### Code Signing
For production distribution, configure code signing in `package.json`:
```json
"build": {
  "win": {
    "certificateFile": "path/to/certificate.p12",
    "certificatePassword": "password"
  },
  "mac": {
    "identity": "Developer ID Application: Your Name"
  }
}
```

## Security

### Best Practices Implemented
- **Context Isolation**: Renderer process is sandboxed
- **Secure IPC**: All communication through preload script
- **Input Validation**: File format and size validation
- **No Node.js Access**: Renderer cannot access Node.js APIs directly
- **Content Security Policy**: Prevents XSS attacks

### API Key Security
- API keys are stored in encrypted format
- Never logged or exposed in development tools
- Configuration stored in secure application data directory

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Review the ElevenLabs API documentation
3. Verify your API key and account status
4. Test with different file formats and sizes

## Version History

### v1.0.0
- Initial release
- ElevenLabs Speech-to-Text integration
- SRT generation with timing adjustment
- Material-UI dark theme interface
- Cross-platform desktop application
- Drag & drop file upload
- Real-time progress tracking
- Comprehensive error handling