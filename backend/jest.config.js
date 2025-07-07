// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/database.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000,
  detectOpenHandles: false, // Disable to avoid hanging
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  collectCoverage: false,
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-key',
      // GEMINI_API_KEY: 'test-gemini-key'
    }
  },
  // Transform options
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb-memory-server)/)'
  ],
  // Ignore problematic modules
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/mongodb-memory-server'
  ]
};