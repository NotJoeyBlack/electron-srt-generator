# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform desktop application for generating SRT subtitle files from audio/video files using ElevenLabs Speech-to-Text API. Built with Electron + React + TypeScript + Material-UI.

## Development Commands

### Essential Commands
```bash
# Start development environment (React dev server + Electron)
npm run dev

# Build for production
npm run build

# Create distributable packages
npm run dist

# Create distributable packages with GitHub token for auto-updates
GITHUB_TOKEN=your_github_token_here npm run dist

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test
```

### Development Workflow
- Use `npm run dev` for development - starts both React dev server and Electron
- Always run `npm run typecheck` and `npm run lint` before committing
- Use `npm run build` before creating distributions

## Architecture

### Dual Process Architecture
- **Main Process** (`electron/`): Node.js backend handling file processing, ElevenLabs API, SRT generation
- **Renderer Process** (`src/`): React frontend with Material-UI components
- **IPC Communication**: Secure bridge via `electron/preload.ts`

### Key Directories
- `src/`: React application (components, hooks, services, theme)
- `electron/`: Main process (services, utils, main.ts, preload.ts)
- `dist/electron/`: Compiled Electron TypeScript output
- `build/`: React production build
- `release/`: Final packaged distributions

### TypeScript Configuration
- **Root tsconfig.json**: React app (ES5 target, React JSX)
- **electron/tsconfig.json**: Electron main process (ES2020, CommonJS, outputs to `dist/electron/`)

## Core Services

### ElevenLabs Integration (`electron/services/elevenlabs.ts`)
- Handles API authentication and transcription requests
- Uses `scribe_v1` model with speaker diarization
- Manages API key security and error handling

### SRT Processing (`electron/services/srtProcessor.ts`)
- Converts transcription to SRT format
- Handles timing optimization and character limits
- Formats speaker labels and subtitle text

### File Processing (`electron/services/fileProcessor.ts`)
- Validates supported formats (MP3, WAV, M4A, MP4, MOV, AVI, etc.)
- Handles file size limits (100MB max)
- Manages file uploads and processing

## Key Patterns

### IPC Communication
- All renderer-to-main communication goes through `src/services/ipcService.ts`
- Main process exposes APIs via `electron/preload.ts`
- Event-driven architecture for progress updates

### Error Handling
- Comprehensive error handling in `electron/utils/errorHandler.ts`
- Type-safe error responses with user-friendly messages
- API errors are caught and formatted appropriately

### Configuration Management
- Uses `electron-store` for persistent settings
- Configuration stored in `electron/utils/config.ts`
- Settings include API keys, character limits, output directories

## Testing

### Test Setup
- Jest with React Testing Library
- Electron API mocking in `src/setupTests.ts`
- Mocks for IntersectionObserver, ResizeObserver, matchMedia

### Running Tests
```bash
npm test          # Run all tests
npm test -- --coverage  # Run with coverage
```

## Security Considerations

### Electron Security
- Context isolation enabled
- Sandboxed renderer process
- No direct Node.js access from renderer
- IPC communication through secure preload script

### API Key Security
- ElevenLabs API keys stored encrypted
- Never exposed to renderer process
- Configuration stored in secure app data directory

## File Structure Notes

### React Components (`src/components/`)
- `FileUpload/`: Drag & drop and file picker
- `Progress/`: Real-time transcription progress
- `Results/`: File management and download
- `Settings/`: Configuration (API key, character limits)

### Custom Hooks (`src/hooks/`)
- `useFileUpload`: File upload logic
- `useTranscription`: Transcription workflow management

### Material-UI Theme (`src/theme/`)
- Dark theme with purple accent colors
- Consistent styling across components

## Common Development Tasks

### Adding New File Formats
1. Update `SUPPORTED_FORMATS` in `electron/services/fileProcessor.ts`
2. Test with ElevenLabs API compatibility
3. Update UI file picker filters

### Modifying SRT Output
1. Edit `electron/services/srtProcessor.ts`
2. Test timing calculations and character limits
3. Ensure proper subtitle formatting

### API Integration Changes
1. Update `electron/services/elevenlabs.ts`
2. Handle new API parameters or responses
3. Update error handling and progress tracking

## Build Distribution

### Cross-Platform Building
- Windows: Creates NSIS installer
- macOS: Creates DMG installer  
- Linux: Creates AppImage package
- Output in `release/` directory

### Electron Builder Configuration
- Configured in `package.json` build section
- Includes proper file patterns and signing setup
- Supports app auto-updater integration

## Auto-Updates

### GitHub Token Setup for Private Repository
The app supports automatic updates from private GitHub repositories. To enable this:

1. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `repo` permissions
   - Copy the token (starts with `ghp_`)

2. **Build with Token (Recommended)**:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here npm run dist
   ```

3. **Alternative: Hardcode Token**:
   - Edit `electron/services/updateManager.ts`
   - Replace `'ghp_REPLACE_WITH_YOUR_GITHUB_TOKEN'` with your actual token
   - **Security Note**: Token will be embedded in the compiled app

### Auto-Update Behavior
- Checks for updates 5 seconds after app startup (production only)
- Downloads updates in background when available
- Prompts user to install when download complete
- Works automatically for all distributed copies (no user configuration needed)