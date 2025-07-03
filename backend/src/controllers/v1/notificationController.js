// src/controllers/v1/notificationController.js
const notificationService = require('../../services/notifications/notificationService');
const webSocketService = require('../../services/notifications/webSocketService');
const responseHelper = require('../../utils/responseHelper');

class NotificationController {
  
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, unreadOnly, type, groupId } = req.query;
      
      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page) || 1,
        limit: Math.min(parseInt(limit) || 20, 50),
        unreadOnly: unreadOnly === 'true',
        type,
        groupId
      });
      
      responseHelper.success(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }
  
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const { groupId } = req.query;
      
      const count = await notificationService.getUnreadCount(userId, groupId);
      
      responseHelper.success(res, { 
        unreadCount: count,
        userId,
        groupId: groupId || null
      }, 'Unread count retrieved');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }
  
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;
      
      const notification = await notificationService.markAsRead(notificationId, userId);
      
      if (!notification) {
        return responseHelper.error(res, 'Notification not found or already read', 404);
      }
      
      responseHelper.success(res, {
        notification: {
          id: notification._id,
          isRead: notification.isRead,
          readAt: notification.readAt
        }
      }, 'Notification marked as read');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }
  
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { groupId } = req.body;
      
      const result = await notificationService.markAllAsRead(userId, groupId);
      
      responseHelper.success(res, { 
        readCount: result.modifiedCount,
        groupId: groupId || null
      }, `${result.modifiedCount} notifications marked as read`);
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async getWebSocketStatus(req, res) {
    try {
      const stats = webSocketService.getConnectionStats();
      
      responseHelper.success(res, {
        ...stats,
        isUserConnected: webSocketService.isUserConnected(req.user.id)
      }, 'WebSocket status retrieved');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async testNotification(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return responseHelper.error(res, 'Test notifications not allowed in production', 403);
      }

      const userId = req.user.id;
      const { type, title, message } = req.body;
      
      const notification = await notificationService.createAndDeliverNotification({
        recipientId: userId,
        groupId: req.user.groupId,
        type: type || 'TASK_ASSIGNED',
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        data: {
          actorId: userId,
          actorName: req.user.name,
          metadata: { test: true }
        },
        priority: 'low'
      });
      
      responseHelper.success(res, { notification }, 'Test notification sent');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }
}

module.exports = new NotificationController();