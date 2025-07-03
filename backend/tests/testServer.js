// tests/testServer.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.test' });

let app;

const setupTestEnvironment = async () => {
  app = express();
  app.use(express.json());

  // Basic test routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Mock basic notification routes for testing without loading full route system
  app.get('/api/v1/notifications', (req, res) => {
    res.json({
      success: true,
      data: {
        notifications: [],
        pagination: { page: 1, total: 0, pages: 0, hasMore: false }
      }
    });
  });

  app.get('/api/v1/notifications/unread-count', (req, res) => {
    res.json({
      success: true,
      data: { unreadCount: 0 }
    });
  });

  app.patch('/api/v1/notifications/:id/read', (req, res) => {
    res.json({
      success: true,
      data: { notification: { id: req.params.id, isRead: true } }
    });
  });

  console.log('🧪 Test environment setup complete');
  return app;
};

// Use a simple mock database connection instead of MongoDB Memory Server
const connectTestDB = async () => {
  try {
    // Mock mongoose connection for testing
    const mockConnection = {
      readyState: 1, // Connected
      collections: {},
      close: jest.fn().mockResolvedValue(true)
    };
    
    // Override mongoose connection
    mongoose.connection = mockConnection;
    
    // Mock database operations
    mongoose.connect = jest.fn().mockResolvedValue(true);
    
    console.log('📝 Mock test database connected');
    return 'mock://test-db';
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
};

const disconnectTestDB = async () => {
  try {
    // Mock disconnection
    if (mongoose.connection && mongoose.connection.close) {
      await mongoose.connection.close();
    }
    console.log('📝 Test database disconnected');
  } catch (error) {
    console.error('❌ Test database disconnect failed:', error);
  }
};

const clearTestDB = async () => {
  try {
    // Mock clearing database
    console.log('🧹 Test database cleared (mocked)');
  } catch (error) {
    console.error('❌ Test database clear failed:', error);
  }
};

const createTestUser = async () => {
  // Mock user data for testing
  return {
    id: 'test-user-id-' + Date.now(),
    _id: 'test-user-id-' + Date.now(),
    email: 'test@example.com',
    name: 'Test User',
    groupId: 'test-group-id-' + Date.now()
  };
};

const createTestToken = () => {
  // Return a mock JWT token for testing
  return 'test-jwt-token-' + Date.now();
};

// Export the app getter instead of null
const getApp = () => app;

module.exports = {
  setupTestEnvironment,
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  createTestUser,
  createTestToken,
  getApp
};