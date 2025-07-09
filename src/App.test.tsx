import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    selectFile: jest.fn(),
    startTranscription: jest.fn(),
    onProgress: jest.fn(),
    onComplete: jest.fn(),
    onError: jest.fn(),
    openFile: jest.fn(),
    showItemInFolder: jest.fn(),
    getConfig: jest.fn().mockResolvedValue({
      elevenlabs_api_key: '',
      default_char_limit: 50,
      supported_formats: ['.mp3', '.mp4', '.wav'],
      output_directory: './output'
    }),
    saveConfig: jest.fn(),
  },
  writable: true
});

test('renders SRT Generator title', () => {
  render(<App />);
  const titleElement = screen.getByText(/SRT Generator/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders file upload section', () => {
  render(<App />);
  const uploadSection = screen.getByText(/Select Media File/i);
  expect(uploadSection).toBeInTheDocument();
});

test('renders drag and drop zone', () => {
  render(<App />);
  const dragDropText = screen.getByText(/Drag & drop your media file here/i);
  expect(dragDropText).toBeInTheDocument();
});

test('renders settings button', () => {
  render(<App />);
  const settingsButton = screen.getByText(/Settings/i);
  expect(settingsButton).toBeInTheDocument();
});

test('renders character limit component', () => {
  render(<App />);
  const characterLimitText = screen.getByText(/Character Limit/i);
  expect(characterLimitText).toBeInTheDocument();
});

test('renders generate SRT button', () => {
  render(<App />);
  const generateButton = screen.getByText(/Generate SRT/i);
  expect(generateButton).toBeInTheDocument();
});