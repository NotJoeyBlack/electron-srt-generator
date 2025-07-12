import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    selectFile: jest.fn().mockResolvedValue(null),
    startTranscription: jest.fn().mockResolvedValue(undefined),
    onProgress: jest.fn(),
    onComplete: jest.fn(),
    onError: jest.fn(),
    openFile: jest.fn().mockResolvedValue(undefined),
    showItemInFolder: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockResolvedValue({
      elevenlabs_api_key: 'test-key',
      default_char_limit: 50,
      supported_formats: ['.mp3', '.mp4', '.wav'],
      output_directory: './output'
    }),
    saveConfig: jest.fn().mockResolvedValue(undefined),
  },
  writable: true
});