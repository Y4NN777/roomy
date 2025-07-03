// tests/setup.js
// Global test setup - Simplified to avoid dependency issues


const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
// process.env.GEMINI_API_KEY = 'test-gemini-key'; // Prevent AI service warnings

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock all external services globally
jest.mock('../src/services/notifications/WebSocketService', () => ({
  initialize: jest.fn().mockReturnValue({}),
  sendToUser: jest.fn().mockReturnValue(true),
  broadcastToGroup: jest.fn(),
  getConnectionStats: jest.fn().mockReturnValue({
    totalConnections: 0,
    totalGroups: 0,
    connectedUsers: [],
    groupMembership: {}
  }),
  isUserConnected: jest.fn().mockReturnValue(false),
  testBroadcast: jest.fn(),
  deliverNotification: jest.fn(),
  cleanup: jest.fn(),
  getConnectedUsers: jest.fn().mockReturnValue([]),
  getGroupMembers: jest.fn().mockReturnValue([])
}));

// Mock email service
jest.mock('../src/config/email', () => ({
  verifyConnection: jest.fn().mockResolvedValue(true),
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  getTransporter: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  })
}));

// Mock AI service to prevent initialization warnings
jest.mock('../src/services/aiService', () => ({
  initializeAI: jest.fn(),
  processVoiceToTasks: jest.fn().mockResolvedValue({
    suggestedTasks: [],
    confidence: 0.8,
    memberMentions: []
  }),
  isEnabled: true
}));

// Mock logger to prevent console spam during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock mongoose to avoid real database connections
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(true),
    collections: {}
  },
  Types: {
    ObjectId: jest.fn().mockImplementation(() => 'mock-object-id-' + Date.now())
  },
  Schema: jest.fn(),
  model: jest.fn()
}));

// Mock push notification service (if it exists)
jest.mock('../src/services/notifications/pushNotificationService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(true),
  initialize: jest.fn(),
  sendToUser: jest.fn().mockResolvedValue(true)
}), { virtual: true });

// Global console override for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: process.env.VERBOSE_TESTS ? originalConsole.log : jest.fn(),
  info: process.env.VERBOSE_TESTS ? originalConsole.info : jest.fn(),
  warn: process.env.VERBOSE_TESTS ? originalConsole.warn : jest.fn(),
  error: originalConsole.error // Keep errors visible
};

// Global teardown
afterAll(async () => {
  // Close any remaining connections
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Restore console if needed
  if (!process.env.VERBOSE_TESTS) {
    global.console = originalConsole;
  }
});