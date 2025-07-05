// src/controllers/v1/notificationController.js
// COMPLETE NOTIFICATION CONTROLLER - Following Service → Controller → Routes pattern

const notificationService = require('../../services/notifications/notificationService');
const webSocketService = require('../../services/notifications/WebSocketService');
const eventBus = require('../../services/notifications/eventBus');
const responseHelper = require('../../utils/responseHelper');
const { EventTypes, NotificationTypes } = require('../../utils/eventTypes');

class NotificationController {
  
  // =====================================
  // BASIC NOTIFICATION OPERATIONS
  // =====================================
  
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false, 
        type, 
        groupId,
        priority,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        unreadOnly: unreadOnly === 'true',
        type,
        groupId,
        priority,
        sortBy,
        sortOrder
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
        groupId: groupId || null,
        timestamp: new Date()
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
      const { groupId, type } = req.body;
      
      const result = await notificationService.markAllAsRead(userId, { groupId, type });
      
      responseHelper.success(res, { 
        readCount: result.modifiedCount,
        groupId: groupId || null,
        type: type || null,
        timestamp: new Date()
      }, `${result.modifiedCount} notifications marked as read`);
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  // =====================================
  // ADVANCED NOTIFICATION OPERATIONS
  // =====================================

  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;
      
      const result = await notificationService.deleteNotification(notificationId, userId);
      
      if (!result) {
        return responseHelper.error(res, 'Notification not found', 404);
      }
      
      responseHelper.success(res, { deletedId: notificationId }, 'Notification deleted');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const { timeframe = '7d' } = req.query;
      
      const stats = await notificationService.getNotificationStats(userId, timeframe);
      
      responseHelper.success(res, stats, 'Notification statistics retrieved');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async getNotificationsByType(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      if (!Object.values(NotificationTypes).includes(type)) {
        return responseHelper.error(res, 'Invalid notification type', 400);
      }
      
      const result = await notificationService.getNotificationsByType(userId, type, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      responseHelper.success(res, result, `${type} notifications retrieved`);
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  // =====================================
  // NOTIFICATION PREFERENCES
  // =====================================

  async getNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      const preferences = await notificationService.getNotificationPreferences(userId);
      
      responseHelper.success(res, preferences, 'Notification preferences retrieved');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      
      const updated = await notificationService.updateNotificationPreferences(userId, preferences);
      
      responseHelper.success(res, updated, 'Notification preferences updated');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  // =====================================
  // REAL-TIME WEBSOCKET OPERATIONS
  // =====================================

  async getWebSocketStatus(req, res) {
    try {
      const userId = req.user.id;
      const stats = webSocketService.getConnectionStats();
      
      responseHelper.success(res, {
        ...stats,
        isUserConnected: webSocketService.isUserConnected(userId),
        userConnectionTime: webSocketService.getUserConnectionTime(userId)
      }, 'WebSocket status retrieved');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async broadcastToGroup(req, res) {
    try {
      const { groupId, message, type = 'SYSTEM_ANNOUNCEMENT' } = req.body;
      const userId = req.user.id;
      
      // Check if user has permission to broadcast to group
      // Add your group permission check here
      
      const notification = await notificationService.createGroupBroadcast({
        groupId,
        message,
        type,
        broadcastBy: userId
      });
      
      responseHelper.success(res, { 
        broadcastId: notification._id,
        groupId,
        message
      }, 'Broadcast sent to group');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async sendDirectNotification(req, res) {
    try {
      const { recipientId, title, message, type = 'DIRECT_MESSAGE', priority = 'medium' } = req.body;
      const senderId = req.user.id;
      
      const notification = await notificationService.sendDirectNotification({
        senderId,
        recipientId,
        title,
        message,
        type,
        priority
      });
      
      responseHelper.success(res, { 
        notificationId: notification._id,
        recipientId,
        deliveryStatus: 'sent'
      }, 'Direct notification sent');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  // =====================================
  // TESTING AND DEBUGGING
  // =====================================

  async testNotification(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return responseHelper.error(res, 'Test notifications not allowed in production', 403);
      }

      const userId = req.user.id;
      const { type, title, message, priority = 'low' } = req.body;
      
      const notification = await notificationService.createAndDeliverNotification({
        recipientId: userId,
        groupId: req.user.groupId,
        type: type || NotificationTypes.TASK_ASSIGNED,
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        data: {
          actorId: userId,
          actorName: req.user.name,
          metadata: { test: true, timestamp: new Date() }
        },
        priority
      });
      
      responseHelper.success(res, { 
        notification: {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          delivered: webSocketService.isUserConnected(userId)
        }
      }, 'Test notification sent');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async testEventEmission(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return responseHelper.error(res, 'Test events not allowed in production', 403);
      }

      const { eventType, eventData } = req.body;
      const userId = req.user.id;
      
      if (!Object.values(EventTypes).includes(eventType)) {
        return responseHelper.error(res, 'Invalid event type', 400);
      }
      
      // Emit test event
      eventBus.emit(eventType, {
        ...eventData,
        testEvent: true,
        triggeredBy: userId,
        timestamp: new Date()
      });
      
      responseHelper.success(res, { 
        eventType,
        emitted: true,
        timestamp: new Date()
      }, 'Test event emitted');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  // =====================================
  // SYSTEM MONITORING
  // =====================================

  async getSystemStats(req, res) {
    try {
      // Only allow admins or in development
      if (process.env.NODE_ENV === 'production' && req.user.role !== 'admin') {
        return responseHelper.error(res, 'Insufficient permissions', 403);
      }

      const eventBusStats = eventBus.getStats();
      const wsStats = webSocketService.getConnectionStats();
      const notificationStats = await notificationService.getSystemStats();
      
      responseHelper.success(res, {
        eventBus: eventBusStats,
        webSocket: wsStats,
        notifications: notificationStats,
        timestamp: new Date()
      }, 'System statistics retrieved');
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  // =====================================
  // BULK OPERATIONS
  // =====================================

  async bulkMarkAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationIds } = req.body;
      
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return responseHelper.error(res, 'Invalid notification IDs array', 400);
      }
      
      const result = await notificationService.bulkMarkAsRead(userId, notificationIds);
      
      responseHelper.success(res, {
        processedCount: result.modifiedCount,
        requestedCount: notificationIds.length,
        timestamp: new Date()
      }, `${result.modifiedCount} notifications marked as read`);
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }

  async bulkDelete(req, res) {
    try {
      const userId = req.user.id;
      const { notificationIds, olderThanDays } = req.body;
      
      let result;
      if (notificationIds) {
        result = await notificationService.bulkDeleteByIds(userId, notificationIds);
      } else if (olderThanDays) {
        result = await notificationService.bulkDeleteOlderThan(userId, olderThanDays);
      } else {
        return responseHelper.error(res, 'Either notificationIds or olderThanDays is required', 400);
      }
      
      responseHelper.success(res, {
        deletedCount: result.deletedCount,
        timestamp: new Date()
      }, `${result.deletedCount} notifications deleted`);
    } catch (error) {
      responseHelper.error(res, error.message, 500);
    }
  }
}

module.exports = new NotificationController();