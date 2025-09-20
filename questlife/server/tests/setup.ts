// Test setup file
import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.JWT_SECRET = 'test-secret';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests
if (process.env.NODE_ENV === 'test') {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  // Keep error and warn for debugging
}