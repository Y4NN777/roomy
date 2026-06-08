// src/routes/v1/notification.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/v1/notificationController');
const { authenticateToken } = require('../../middleware/auth');
const { query, body, param } = require('express-validator');
const validation = require('../../middleware/validation');

// Applies authentication middleware to all routes in this file, ensuring only authenticated users can access them.
router.use(authenticateToken);

// Route to retrieve user notifications with optional filtering and pagination.
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('unreadOnly').optional().isBoolean(),
  query('type').optional().isString(),
  query('groupId').optional().isMongoId(),
  validation.handleValidationErrors
], notificationController.getNotifications);

// Route to get the count of unread notifications.
router.get('/unread-count', [
  query('groupId').optional().isMongoId(),
  validation.handleValidationErrors
], notificationController.getUnreadCount);

// Route to mark a specific notification as read.
router.patch('/:notificationId/read', [
  param('notificationId').isMongoId(),
  validation.handleValidationErrors
], notificationController.markAsRead);

// Route to mark all notifications as read, optionally filtered by group.
router.patch('/mark-all-read', [
  body('groupId').optional().isMongoId(),
  validation.handleValidationErrors
], notificationController.markAllAsRead);

// Route to get the status of the WebSocket connection for real-time notifications.
router.get('/websocket/status', notificationController.getWebSocketStatus);


router.post(
  '/broadcast',
  [
    body('groupId').isMongoId(),
    body('message').isString().isLength({ min: 1, max: 1000 }),
    verifyGroupMembership,   // checks user is in the group
    verifyAdminGroup,        // checks user is admin of the group
    validation.handleValidationErrors
  ],
  notificationController.broadcastToGroup
);

// Defines a development-only route for testing notification delivery.
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', [
    body('type').optional().isString(),
    body('title').optional().isString().isLength({ max: 100 }),
    body('message').optional().isString().isLength({ max: 500 }),
    validation.handleValidationErrors
  ], notificationController.testNotification);
}

module.exports = router;