/**
 * Jest test setup file
 * Global test configuration and mocks
 */

import * as fs from 'fs';
import * as path from 'path';
import '@testing-library/jest-dom';

// Mock file system operations for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    access: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
  }
}));

// Mock chokidar for file watching
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    close: jest.fn().mockResolvedValue(undefined),
  }))
}));

// Mock pino logger
jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => mockLogger),
  };
  
  const pinoMock = jest.fn(() => mockLogger);
  pinoMock.stdTimeFunctions = {
    isoTime: () => new Date().toISOString()
  };
  
  return pinoMock;
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock window APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Increase test timeout for async operations
jest.setTimeout(10000);

// Global test utilities
(global as any).testUtils = {
  createMockStats: (size: number, mtime: Date = new Date()) => ({
    size,
    mtime,
    birthtime: mtime,
    isFile: () => true,
    isDirectory: () => false,
  }),
  
  createTempDir: () => {
    const tempDir = path.join(__dirname, 'temp', Math.random().toString(36).substring(7));
    if (!fs.existsSync(path.dirname(tempDir))) {
      fs.mkdirSync(path.dirname(tempDir), { recursive: true });
    }
    return tempDir;
  },

  cleanupTempDir: (dir: string) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
};