// Vitest setup file
import { config } from '@vue/test-utils';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock indexedDB
const mockDB = {
  databases: new Map(),
  open: vi.fn().mockImplementation(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: [],
      transaction: vi.fn(),
      close: vi.fn()
    }
  }))
};

// @ts-ignore
global.indexedDB = mockDB;

// Configure Vue Test Utils
config.global.mocks = {};
config.global.stubs = {};
config.global.plugins = [];