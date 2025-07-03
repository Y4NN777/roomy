// src/routes/v1/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/v1/notificationController');
const authenticateToken = require('../../middleware/auth');
const { query, body } = require('express-validator');
const validation = require('../../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Get user notifications
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('unreadOnly').optional().isBoolean(),
  query('type').optional().isString(),
  query('groupId').optional().isMongoId(),
  validation.handleValidationErrors
], notificationController.getNotifications);

// Get unread count
router.get('/unread-count', [
  query('groupId').optional().isMongoId(),
  validation.handleValidationErrors
], notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', [
  param('notificationId').isMongoId(),
  validation.handleValidationErrors
], notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', [
  body('groupId').optional().isMongoId(),
  validation.handleValidationErrors
], notificationController.markAllAsRead);

// WebSocket status
router.get('/websocket/status', notificationController.getWebSocketStatus);

// Test notification (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', [
    body('type').optional().isString(),
    body('title').optional().isString().isLength({ max: 100 }),
    body('message').optional().isString().isLength({ max: 500 }),
    validation.handleValidationErrors
  ], notificationController.testNotification);
}

module.exports = router;