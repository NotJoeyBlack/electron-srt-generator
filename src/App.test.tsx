import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
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
  const { getByText } = render(<App />);
  const titleElement = getByText(/SRT Generator/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders file upload section', () => {
  const { getByText } = render(<App />);
  const uploadSection = getByText(/Select Media File/i);
  expect(uploadSection).toBeInTheDocument();
});

test('renders drag and drop zone', () => {
  const { getByText } = render(<App />);
  const dragDropText = getByText(/Drag & drop your media file here/i);
  expect(dragDropText).toBeInTheDocument();
});

test('renders settings button', () => {
  const { getByText } = render(<App />);
  const settingsButton = getByText(/Settings/i);
  expect(settingsButton).toBeInTheDocument();
});

test('renders character limit component', () => {
  const { getByText } = render(<App />);
  const characterLimitText = getByText(/Character Limit/i);
  expect(characterLimitText).toBeInTheDocument();
});

test('renders generate SRT button', () => {
  const { getByText } = render(<App />);
  const generateButton = getByText(/Generate SRT/i);
  expect(generateButton).toBeInTheDocument();
});