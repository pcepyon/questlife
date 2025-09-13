// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

// Suppress console logs during tests
if (process.env.NODE_ENV === 'test') {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  // Keep error and warn for debugging
}