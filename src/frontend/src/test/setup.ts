// Test setup — runs before each test file
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// Mock ResizeObserver
(window as unknown as Record<string, unknown>).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
(window as unknown as Record<string, unknown>).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Silence console errors in tests (reduce noise for known issues)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    (msg.includes('Warning:') || msg.includes('act('))
  ) {
    return;
  }
  originalConsoleError(...args);
};
