const emailConfig = require('../../config/email');
const mongoose = require('mongoose');
const emailTemplates = require('../../utils/emailTemplates');
const logger = require('../../utils/logger');
const User = require('../../models/User');
const eventBus = require('./eventBus');
const Group = require('../../models/Group');
const Notification = require('../../models/Notification');
const { EventTypes, NotificationTypes, NotificationPriority } = require('../../utils/eventTypes');


class NotificationService {
  constructor() {
    logger.info('🔔 NotificationService initializing...');
    // Check email configuration
    this.emailEnabled = this.checkEmailConfig();
    logger.info('📧 Email enabled in notification service:', this.emailEnabled);
    this.setupEventListeners();
  }



  setupEventListeners() {

    console.log('🎧 Setting up NotificationService event listeners...');

    // Task Events - using your existing handlers
    eventBus.on(EventTypes.TASK_ASSIGNED, (data) => this.handleTaskAssigned(data));
    eventBus.on(EventTypes.TASK_COMPLETED, (data) => this.handleTaskCompleted(data));
    eventBus.on(EventTypes.TASK_DUE_SOON, (data) => this.handleTaskDueSoon(data));

    // New task events - map to existing handlers or create simple ones
    eventBus.on(EventTypes.TASK_CREATED, (data) => this.handleTaskCreated(data));
    eventBus.on(EventTypes.TASK_UPDATED, (data) => this.handleTaskUpdated(data));
    eventBus.on(EventTypes.TASK_DELETED, (data) => this.handleTaskDeleted(data));

    // AI Events - using your existing handlers
    eventBus.on(EventTypes.AI_TASKS_CONFIRMED, (data) => this.handleAITasksConfirmed(data));
    eventBus.on(EventTypes.AI_PROCESSING_COMPLETED, (data) => this.handleAIProcessingCompleted(data));
    eventBus.on(EventTypes.AI_TASKS_SUGGESTED, (data) => this.handleAITasksSuggested(data));
const emailConfig = require('../../config/email');
const mongoose = require('mongoose');
const emailTemplates = require('../../utils/emailTemplates');
const logger = require('../../utils/logger');
const User = require('../../models/User');
const eventBus = require('./eventBus');
const Group = require('../../models/Group');
const Notification = require('../../models/Notification');
const { EventTypes, NotificationTypes, NotificationPriority } = require('../../utils/eventTypes'); 


class NotificationService {
  constructor() {
    logger.info('🔔 NotificationService initializing...');
    // Check email configuration
    this.emailEnabled = this.checkEmailConfig();
    logger.info('📧 Email enabled in notification service:', this.emailEnabled);
    this.setupEventListeners();
  }



  setupEventListeners() {

    console.log('🎧 Setting up NotificationService event listeners...');
    
    // Task Events - using your existing handlers
    eventBus.on(EventTypes.TASK_ASSIGNED, (data) => this.handleTaskAssigned(data));
    eventBus.on(EventTypes.TASK_COMPLETED, (data) => this.handleTaskCompleted(data));
    eventBus.on(EventTypes.TASK_DUE_SOON, (data) => this.handleTaskDueSoon(data));
    
    // New task events - map to existing handlers or create simple ones
    eventBus.on(EventTypes.TASK_CREATED, (data) => this.handleTaskCreated(data));
    eventBus.on(EventTypes.TASK_UPDATED, (data) => this.handleTaskUpdated(data));
    eventBus.on(EventTypes.TASK_DELETED, (data) => this.handleTaskDeleted(data));
    
    // AI Events - using your existing handlers
    eventBus.on(EventTypes.AI_TASKS_CONFIRMED, (data) => this.handleAITasksConfirmed(data));
    eventBus.on(EventTypes.AI_PROCESSING_COMPLETED, (data) => this.handleAIProcessingCompleted(data));
    eventBus.on(EventTypes.AI_TASKS_SUGGESTED, (data) => this.handleAITasksSuggested(data));
    
    // Expense Events - using your existing handlers
    eventBus.on(EventTypes.EXPENSE_ADDED, (data) => this.handleExpenseAdded(data));
    eventBus.on(EventTypes.EXPENSE_CREATED, (data) => this.handleExpenseAdded(data)); // Alias
    eventBus.on(EventTypes.EXPENSE_SPLIT_PAID, (data) => this.handleExpenseSplitPaid(data));
    
    // New expense events - create simple handlers
    eventBus.on(EventTypes.EXPENSE_UPDATED, (data) => this.handleExpenseUpdated(data));
    eventBus.on(EventTypes.EXPENSE_DELETED, (data) => this.handleExpenseDeleted(data));
    eventBus.on(EventTypes.EXPENSE_FULLY_SETTLED, (data) => this.handleExpenseFullySettled(data));
    eventBus.on(EventTypes.EXPENSE_SPLITS_CHANGED, (data) => this.handleExpenseSplitsChanged(data));
    
    // Group Events - using your existing handlers
    eventBus.on(EventTypes.GROUP_MEMBER_JOINED, (data) => this.handleGroupMemberJoined(data));
    
    // New group events - create simple handlers
    eventBus.on(EventTypes.GROUP_CREATED, (data) => this.handleGroupCreated(data));
    eventBus.on(EventTypes.GROUP_UPDATED, (data) => this.handleGroupUpdated(data));
    eventBus.on(EventTypes.GROUP_MEMBER_LEFT, (data) => this.handleGroupMemberLeft(data));
    eventBus.on(EventTypes.GROUP_MEMBER_REMOVED, (data) => this.handleGroupMemberRemoved(data));
    eventBus.on(EventTypes.GROUP_ADMIN_TRANSFERRED, (data) => this.handleGroupAdminTransferred(data));
    eventBus.on(EventTypes.GROUP_EMAIL_INVITATION_SENT, (data) => this.handleGroupEmailInvitationSent(data));
    
    console.log('✅ NotificationService event listeners registered');
  }

// Add these simple handler methods to your NotificationService class
// (only the new ones - keep your existing handlers as they are)

async handleTaskCreated(data) {
  const { task, assignedUser, createdBy, groupId } = data;
  
  try {
    // Create in-app notification for assigned user (if different from creator)
    if (assignedUser && assignedUser._id.toString() !== createdBy._id.toString()) {
      await this.createAndDeliverNotification({
        recipientId: assignedUser._id,
        groupId: task.groupId._id,
        type: NotificationTypes.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `${createdBy.name} assigned you "${task.title}"`,
        data: {
          taskId: task._id,
          actorId: createdBy._id,
          actorName: createdBy.name,
          dueDate: task.dueDate,
          priority: task.priority,
          actionUrl: `/tasks/${task._id}`
        },
        priority: task.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
      });
    }
    
    // Send WebSocket update for group activity
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'TASK_CREATED',
        message: `${createdBy.name} created task: "${task.title}"`,
        actor: createdBy.name,
        taskId: task._id
      });
    }
    
  } catch (error) {
    console.error('Error handling task created event:', error);
  }
}

async handleTaskUpdated(data) {
  const { updatedTask, updater, groupId } = data;
  
  try {
    // Send WebSocket update for group activity
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'TASK_UPDATED',
        message: `${updater.name} updated task: "${updatedTask.title}"`,
        actor: updater.name,
        taskId: updatedTask._id
      });
    }
  } catch (error) {
    console.error('Error handling task updated event:', error);
  }
}

async handleTaskDeleted(data) {
  const { task, deletedBy, groupId } = data;
  
  try {
    // Get deleter name
    const deleter = await User.findById(deletedBy).select('name');
    
    // Send WebSocket update for group activity
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'TASK_DELETED',
        message: `${deleter.name} deleted task: "${task.title}"`,
        actor: deleter.name
      });
    }
  } catch (error) {
    console.error('Error handling task deleted event:', error);
  }
}

async handleExpenseUpdated(data) {
  const { updatedExpense, updatedBy, groupId } = data;
  
  try {
    // Get updater name
    const updater = await User.findById(updatedBy).select('name');
    
    // Send WebSocket update for group activity
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'EXPENSE_UPDATED',
        message: `${updater.name} updated expense: ${updatedExpense.description}`,
        actor: updater.name,
        expenseId: updatedExpense._id
      });
    }
  } catch (error) {
    console.error('Error handling expense updated event:', error);
  }
}

async handleExpenseDeleted(data) {
  const { expense, deletedBy, groupId } = data;
  
  try {
    // Get deleter name
    const deleter = await User.findById(deletedBy).select('name');
    
    // Send WebSocket update for group activity
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'EXPENSE_DELETED',
        message: `${deleter.name} deleted expense: "${expense.description}"`,
        actor: deleter.name
      });
    }
  } catch (error) {
    console.error('Error handling expense deleted event:', error);
  }
}

async handleExpenseFullySettled(data) {
  const { expense, groupId } = data;
  
  try {
    // Send WebSocket celebration update
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'EXPENSE_SETTLED',
        message: `🎉 "${expense.description}" is fully settled!`,
        expenseId: expense._id
      });
    }
  } catch (error) {
    console.error('Error handling expense fully settled event:', error);
  }
}

async handleExpenseSplitsChanged(data) {
  const { expense, updatedBy, groupId } = data;
  
  try {
    // Get updater name
    const updater = await User.findById(updatedBy).select('name');
    
    // Send WebSocket update
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
        type: 'SPLITS_CHANGED',
        message: `${updater.name} updated splits for "${expense.description}"`,
        actor: updater.name,
        expenseId: expense._id
      });
    }
  } catch (error) {
    console.error('Error handling expense splits changed event:', error);
  }
}

async handleGroupCreated(data) {
  const { group, creator } = data;
  
  try {
    // Could send welcome notification or other group creation logic
    console.log(`Group "${group.name}" created by ${creator.name}`);
  } catch (error) {
    console.error('Error handling group created event:', error);
  }
}

async handleGroupUpdated(data) {
  const { group, updatedBy } = data;
  
  try {
    // Get updater name
    const updater = await User.findById(updatedBy).select('name');
    
    // Send WebSocket update
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
        type: 'GROUP_UPDATED',
        message: `${updater.name} updated group settings`,
        actor: updater.name
      });
    }
  } catch (error) {
    console.error('Error handling group updated event:', error);
  }
}

async handleGroupMemberLeft(data) {
  const { group, leftMember } = data;
  
  try {
    // Get member name
    const member = await User.findById(leftMember).select('name');
    
    // Send WebSocket update
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
        type: 'MEMBER_LEFT',
        message: `${member.name} left the group`,
        actor: member.name
      });
    }
  } catch (error) {
    console.error('Error handling group member left event:', error);
  }
}

async handleGroupMemberRemoved(data) {
  const { group, removedMember, removedBy } = data;
  
  try {
    // Get remover name
    const remover = await User.findById(removedBy).select('name');
    
    // Send WebSocket update
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
        type: 'MEMBER_REMOVED',
        message: `${remover.name} removed ${removedMember.name} from the group`,
        actor: remover.name
      });
    }
    
    // Send notification to removed member
    await this.createAndDeliverNotification({
      recipientId: removedMember._id,
      groupId: group._id,
      type: NotificationTypes.GROUP_MEMBER_LEFT,
      title: 'Removed from Group',
      message: `You were removed from "${group.name}" by ${remover.name}`,
      data: {
        actorId: removedBy,
        actorName: remover.name
      },
      priority: NotificationPriority.HIGH
    });
    
  } catch (error) {
    console.error('Error handling group member removed event:', error);
  }
}

async handleGroupAdminTransferred(data) {
  const { group, oldAdmin, newAdmin } = data;
  
  try {
    // Send notification to new admin
    await this.createAndDeliverNotification({
      recipientId: newAdmin._id,
      groupId: group._id,
      type: NotificationTypes.GROUP_ROLE_CHANGED,
      title: 'You are now an Admin',
      message: `${oldAdmin.name} transferred admin rights to you for "${group.name}"`,
      data: {
        actorId: oldAdmin._id,
        actorName: oldAdmin.name
      },
      priority: NotificationPriority.HIGH
    });
    
    // Send WebSocket update
    if (this.socketHandler) {
      this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
        type: 'ADMIN_TRANSFERRED',
        message: `${oldAdmin.name} made ${newAdmin.name} the new admin`,
        actor: oldAdmin.name
      });
    }
    
  } catch (error) {
    console.error('Error handling group admin transferred event:', error);
  }
}

async handleGroupEmailInvitationSent(data) {
  const { recipientEmail, inviter, group } = data;
  
  try {
    // Just log the invitation was sent (email already sent by service)
    console.log(`Email invitation sent to ${recipientEmail} for group "${group.name}" by ${inviter.name}`);
  } catch (error) {
    console.error('Error handling group email invitation sent event:', error);
  }
}

async handleAITasksSuggested(data) {
  const { userId, result } = data;
  
  try {
    // Send real-time update about AI suggestions
    if (this.socketHandler) {
      this.socketHandler.sendToUser(userId, 'ai:tasks_suggested', {
        suggestedTasks: result.suggestedTasks,
        confidence: result.confidence,
        memberMentions: result.memberMentions,
        processingTime: result.processingTime
      });
    }
  } catch (error) {
    console.error('Error handling AI tasks suggested event:', error);
  }
}


  checkEmailConfig() {
    // Check environment variables directly
    const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    logger.debug('Email credentials check:', hasCredentials);
    return hasCredentials;
  }

  async sendEmail(to, subject, html, text) {
    logger.info(`📧 Attempting to send email to: ${to}`);
    
    // Check if we have email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('⚠️ Email credentials not configured');
      return { 
        success: false, 
        reason: 'Email credentials not configured'
      };
    }

    // Get transporter
    const transporter = emailConfig.getTransporter();
    
    if (!transporter) {
      logger.error('⚠️ Email transporter is null');
      return { 
        success: false, 
        reason: 'Email transporter not available'
      };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Roomy App',
          address: process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        text
      };

      logger.info('📤 Sending email...');
      const info = await transporter.sendMail(mailOptions);
      
      logger.info(`✅ Email sent successfully to ${to}:`, info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId,
        to: to
      };
    } catch (error) {
      logger.error('❌ Email sending failed:', error.message);
      return { 
        success: false, 
        error: error.message
      };
    }
  }

  async sendGroupInvitation(data) {
    const { recipientEmail, inviterName, groupName, inviteCode } = data;
    
    try {
      const appBaseUrl = process.env.APP_BASE_URL || 'https://roomy.app';
      
      const template = emailTemplates.groupInvitation({
        inviterName,
        groupName,
        inviteCode,
        appBaseUrl
      });

      const result = await this.sendEmail(
        recipientEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Group invitation sent to ${recipientEmail} for group ${groupName}`);
      } else {
        logger.warn(`⚠️ Group invitation failed to ${recipientEmail}:`, result.reason || result.error);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send group invitation error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeToGroup(data) {
    const { userEmail, userName, groupName, memberCount, adminName } = data;
    
    try {
      const template = emailTemplates.welcomeToGroup({
        userName,
        groupName,
        memberCount,
        adminName
      });

      const result = await this.sendEmail(
        userEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`Welcome email sent to ${userEmail} for group ${groupName}`);
      }

      return result;
    } catch (error) {
      logger.error('Send welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRoleChangeNotification(data) {
    const { userEmail, userName, groupName, newRole, changedBy } = data;
    
    try {
      const template = emailTemplates.roleChanged({
        userName,
        groupName,
        newRole,
        changedBy
      });

      const result = await this.sendEmail(
        userEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`Role change notification sent to ${userEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('Send role change notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // In-app notification methods (for future real-time notifications)
  async sendInAppNotification(userId, notification) {
    // This would integrate with WebSocket or push notification service
    // For now, just log it
    logger.info(`In-app notification for user ${userId}:`, notification);
    
    return {
      success: true,
      type: 'in-app',
      userId,
      notification
    };
  }

  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId
      });
      
      if (result) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:deleted', {
            notificationId
          });
        } catch (error) {
          console.warn('Failed to send delete update via WebSocket:', error.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotificationStats(userId, timeframe = '7d') {
    try {
      const days = parseInt(timeframe.replace('d', ''));
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [totalStats, typeStats, priorityStats, readStats] = await Promise.all([
        // Total notifications
        Notification.countDocuments({
          recipientId: userId,
          createdAt: { $gte: startDate }
        }),
        
        // By type
        Notification.aggregate([
          {
            $match: {
              recipientId: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
            }
          }
        ]),
        
        // By priority
        Notification.aggregate([
          {
            $match: {
              recipientId:new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Read/unread stats
        Notification.aggregate([
          {
            $match: {
              recipientId:new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              read: { $sum: { $cond: ['$isRead', 1, 0] } },
              avgReadTime: {
                $avg: {
                  $cond: [
                    '$readAt',
                    { $subtract: ['$readAt', '$createdAt'] },
                    null
                  ]
                }
              }
            }
          }
        ])
      ]);
      
      const readData = readStats[0] || { total: 0, read: 0, avgReadTime: 0 };
      
      return {
        timeframe,
        total: totalStats,
        unread: totalStats - readData.read,
        readRate: totalStats > 0 ? (readData.read / totalStats * 100).toFixed(1) : '0.0',
        avgReadTimeMinutes: readData.avgReadTime ? Math.round(readData.avgReadTime / (1000 * 60)) : 0,
        byType: typeStats.reduce((acc, item) => {
          acc[item._id] = { total: item.count, unread: item.unread };
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  async getNotificationsByType(userId, type, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      const filter = { 
        recipientId: userId, 
        type: type 
      };
      
      const notifications = await Notification
        .find(filter)
        .populate('data.actorId', 'name profilePicture')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();
      
      const total = await Notification.countDocuments(filter);
      
      return {
        notifications,
        type,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      };
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw error;
    }
  }

  async getNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId).select('notificationPreferences');
      
      // Default preferences if none exist
      const defaultPreferences = {
        email: {
          taskAssigned: true,
          taskCompleted: true,
          taskDueSoon: true,
          expenseAdded: true,
          expenseSplitPaid: true,
          groupMemberJoined: false,
          aiTasksReady: true
        },
        push: {
          taskAssigned: true,
          taskCompleted: false,
          taskDueSoon: true,
          expenseAdded: true,
          expenseSplitPaid: true,
          groupMemberJoined: false,
          aiTasksReady: true
        },
        inApp: {
          taskAssigned: true,
          taskCompleted: true,
          taskDueSoon: true,
          expenseAdded: true,
          expenseSplitPaid: true,
          groupMemberJoined: true,
          aiTasksReady: true
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      };
      
      return user?.notificationPreferences || defaultPreferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences: preferences },
        { new: true, runValidators: true }
      ).select('notificationPreferences');
      
      return user.notificationPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async createGroupBroadcast(data) {
    try {
      const { groupId, message, type, broadcastBy } = data;
      
      // Get group members
      const Group = require('../../models/Group');
      const group = await Group.findById(groupId).populate('members.userId', 'name email');
      
      if (!group) {
        throw new Error('Group not found');
      }
      
      const broadcaster = await User.findById(broadcastBy).select('name');
      const broadcasterName = broadcaster ? broadcaster.name : 'Group Admin';
      
      // Create notifications for all group members except broadcaster
      const notifications = [];
      
      for (const member of group.members) {
        if (member.userId._id.toString() !== broadcastBy.toString()) {
          const notification = await this.createAndDeliverNotification({
            recipientId: member.userId._id,
            groupId: groupId,
            type: type || NotificationTypes.SYSTEM_ANNOUNCEMENT,
            title: '📢 Group Announcement',
            message: message,
            data: {
              actorId: broadcastBy,
              actorName: broadcasterName,
              broadcastType: type,
              actionUrl: `/groups/${groupId}`
            },
            priority: NotificationPriority.MEDIUM
          });
          
          notifications.push(notification);
        }
      }
      
      return {
        broadcastId: notifications[0]?._id,
        groupId,
        message,
        recipientCount: notifications.length
      };
    } catch (error) {
      console.error('Error creating group broadcast:', error);
      throw error;
    }
  }

  async sendDirectNotification(data) {
    try {
      const { senderId, recipientId, title, message, type, priority } = data;
      
      const sender = await User.findById(senderId).select('name');
      const senderName = sender ? sender.name : 'User';
      
      const notification = await this.createAndDeliverNotification({
        recipientId: recipientId,
        type: type || 'DIRECT_MESSAGE',
        title: title,
        message: message,
        data: {
          actorId: senderId,
          actorName: senderName,
          isDirect: true
        },
        priority: priority || NotificationPriority.MEDIUM
      });
      
      return notification;
    } catch (error) {
      console.error('Error sending direct notification:', error);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const [total, last24hCount, last7dCount, unreadCount, typeDistribution] = await Promise.all([
        Notification.countDocuments({}),
        Notification.countDocuments({ createdAt: { $gte: last24h } }),
        Notification.countDocuments({ createdAt: { $gte: last7d } }),
        Notification.countDocuments({ isRead: false }),
        Notification.aggregate([
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ])
      ]);
      
      return {
        total,
        last24h: last24hCount,
        last7d: last7dCount,
        unread: unreadCount,
        readRate: total > 0 ? ((total - unreadCount) / total * 100).toFixed(1) : '0.0',
        typeDistribution: typeDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  async bulkMarkAsRead(userId, notificationIds) {
    try {
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipientId: userId,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );
      
      if (result.modifiedCount > 0) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:bulk_read', {
            notificationIds,
            readCount: result.modifiedCount
          });
        } catch (error) {
          console.warn('Failed to send bulk read update via WebSocket:', error.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      throw error;
    }
  }

  async bulkDeleteByIds(userId, notificationIds) {
    try {
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipientId: userId
      });
      
      if (result.deletedCount > 0) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:bulk_deleted', {
            notificationIds,
            deletedCount: result.deletedCount
          });
        } catch (error) {
          console.warn('Failed to send bulk delete update via WebSocket:', error.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      throw error;
    }
  }

  async bulkDeleteOlderThan(userId, olderThanDays) {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const result = await Notification.deleteMany({
        recipientId: userId,
        createdAt: { $lt: cutoffDate }
      });
      
      if (result.deletedCount > 0) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:bulk_deleted', {
            olderThanDays,
            deletedCount: result.deletedCount
          });
        } catch (error) {
          console.warn('Failed to send bulk delete update via WebSocket:', error.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error bulk deleting old notifications:', error);
      throw error;
    }
  }

  async getNotificationTimeline(userId, options = {}) {
    try {
      const { days = 7, groupId } = options;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const filter = {
        recipientId: userId,
        createdAt: { $gte: startDate }
      };
      
      if (groupId) {
        filter.groupId = groupId;
      }
      
      const timeline = await Notification.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type'
            },
            count: { $sum: 1 },
            notifications: { $push: '$$ROOT' }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            types: {
              $push: {
                type: '$_id.type',
                count: '$count',
                notifications: '$notifications'
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        { $sort: { _id: -1 } }
      ]);
      
      return {
        timeframe: `${days}d`,
        timeline: timeline.map(day => ({
          date: day._id,
          totalCount: day.totalCount,
          types: day.types
        }))
      };
    } catch (error) {
      console.error('Error getting notification timeline:', error);
      throw error;
    }
  }

  async snoozeNotification(notificationId, userId, snoozeUntil) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: userId
        },
        {
          isSnoozed: true,
          snoozedUntil: new Date(snoozeUntil),
          snoozeCount: { $inc: 1 }
        },
        { new: true }
      );
      
      if (notification) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:snoozed', {
            notificationId,
            snoozedUntil: snoozeUntil
          });
        } catch (error) {
          console.warn('Failed to send snooze update via WebSocket:', error.message);
        }
      }
      
      return notification;
    } catch (error) {
      console.error('Error snoozing notification:', error);
      throw error;
    }
  }

  async getNotificationDigest(userId, period = 'daily') {
    try {
      let startDate, endDate;
      const now = new Date();
      
      if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'weekly') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
      }
      
      const [notifications, stats] = await Promise.all([
        Notification.find({
          recipientId: userId,
          createdAt: { $gte: startDate, $lt: endDate }
        })
        .populate('data.actorId', 'name')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
        
        Notification.aggregate([
          {
            $match: {
              recipientId: mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
            }
          }
        ])
      ]);
      
      const summary = {
        period,
        startDate,
        endDate,
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
        byType: stats.reduce((acc, stat) => {
          acc[stat._id] = { total: stat.count, unread: stat.unread };
          return acc;
        }, {}),
        highlights: notifications.slice(0, 5) // Top 5 most recent
      };
      
      return {
        summary,
        notifications: notifications.slice(0, 20) // Last 20 for digest
      };
    } catch (error) {
      console.error('Error getting notification digest:', error);
      throw error;
    }
  }


  async notifyGroupMembersOfNewJoin(groupMembers, newMemberName, groupName) {
    const notifications = [];
    
    for (const member of groupMembers) {
      try {
        const notification = await this.sendInAppNotification(member.userId, {
          type: 'member_joined',
          title: 'New member joined!',
          message: `${newMemberName} joined ${groupName}`,
          timestamp: new Date(),
          groupId: member.groupId
        });
        
        notifications.push(notification);
      } catch (error) {
        logger.error(`Failed to notify member ${member.userId}:`, error);
      }
    }
    
    return notifications;
  }




  async notifyTaskReassignment(data) {
    const { newAssigneeEmail, newAssigneeName, taskTitle, reassignedBy, groupName, dueDate, priority } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task reassignment notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.taskReassigned({
        newAssigneeName,
        taskTitle,
        reassignedBy,
        groupName,
        dueDate,
        priority
      });

      const result = await this.sendEmail(
        newAssigneeEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Task reassignment notification sent to ${newAssigneeEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send task reassignment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTaskUpdate(data) {
    const { assigneeEmail, assigneeName, taskTitle, updatedBy, groupName, changes } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task update notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.taskUpdated({
        assigneeName,
        taskTitle,
        updatedBy,
        groupName,
        changes
      });

      const result = await this.sendEmail(
        assigneeEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Task update notification sent to ${assigneeEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send task update notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTaskCompletion(data) {
    const { creatorEmail, creatorName, taskTitle, completedBy, groupName, actualDuration } = data;

    if (!this.emailEnabled) {
        logger.warn('📧 Email not configured, skipping task completion notification');
        return { success: false, reason: 'Email not configured' };
    }

    try {
        const template = emailTemplates.taskCompleted({
        creatorName,
        taskTitle,
        completedBy,
        groupName,
        actualDuration
        });

        const result = await this.sendEmail(
        creatorEmail,
        template.subject,
        template.html,
        template.text
        );

        if (result.success) {
        logger.info(`✅ Task completion notification sent to ${creatorEmail}`);
        }

        return result;
    } catch (error) {
        logger.error('❌ Send task completion notification error:', error);
        return { success: false, error: error.message };
    }
    }

  async notifyTaskDueSoon(data) {
    const { assigneeEmail, assigneeName, taskTitle, groupName, dueDate } = data;

    if (!this.emailEnabled) {
        logger.warn('📧 Email not configured, skipping due date reminder');
        return { success: false, reason: 'Email not configured' };
    }

    try {
        const now = new Date();
        const due = new Date(dueDate);
        const hoursUntilDue = Math.round((due - now) / (1000 * 60 * 60));

        const template = emailTemplates.taskDueSoon({
        assigneeName,
        taskTitle,
        groupName,
        dueDate,
        hoursUntilDue
        });

        const result = await this.sendEmail(
        assigneeEmail,
        template.subject,
        template.html,
        template.text
        );

        if (result.success) {
        logger.info(`✅ Task due reminder sent to ${assigneeEmail}`);
        }

        return result;
    } catch (error) {
        logger.error('❌ Send task due reminder error:', error);
        return { success: false, error: error.message };
    }
  }


  async notifyTaskAssignment(assigneeEmail, assigneeName, taskTitle, assignedBy, groupName, taskDetails = {}) {
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task assignment notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const { dueDate, priority, description, estimatedDuration } = taskDetails;
      
      const subject = `📋 New task assigned: "${taskTitle}"`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .task-card { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .priority-badge { background-color: ${priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">📋 New Task Assigned</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName}!</h2>
              <p><strong>${assignedBy}</strong> assigned you a new task in <strong>${groupName}</strong>:</p>
              
              <div class="task-card">
                <h3>📋 ${taskTitle}</h3>
                ${description ? `<p>${description}</p>` : ''}
                ${priority ? `<p><span class="priority-badge">${priority.toUpperCase()}</span></p>` : ''}
                ${dueDate ? `<p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
                ${estimatedDuration ? `<p><strong>Estimated time:</strong> ${estimatedDuration} minutes</p>` : ''}
              </div>

              <p>Check the Roomy app to see the full details and mark it complete when done! 🎯</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const text = `
  Hi ${assigneeName}!

  ${assignedBy} assigned you a new task in ${groupName}:

  📋 ${taskTitle}
  ${description ? `Description: ${description}` : ''}
  ${priority ? `Priority: ${priority.toUpperCase()}` : ''}
  ${dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}` : ''}
  ${estimatedDuration ? `Estimated time: ${estimatedDuration} minutes` : ''}

  Check the Roomy app to see the full details and mark it complete when done!
      `;
      
      const result = await this.sendEmail(assigneeEmail, subject, html, text);
      
      if (result.success) {
        logger.info(`✅ Enhanced task assignment notification sent to ${assigneeEmail}`);
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Send enhanced task assignment notification error:', error);
      return { success: false, error: error.message };
    }
  }
  // Batch notification methods
  async sendBulkNotifications(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        let result;
        
        switch (notification.type) {
          case 'group_invitation':
            result = await this.sendGroupInvitation(notification.data);
            break;
          case 'welcome_to_group':
            result = await this.sendWelcomeToGroup(notification.data);
            break;
          case 'role_changed':
            result = await this.sendRoleChangeNotification(notification.data);
            break;
          case 'task_assigned':
            result = await this.notifyTaskAssignment(notification.data);
            break;
          default:
            result = { success: false, error: 'Unknown notification type' };
        }
        
        results.push({ 
          id: notification.id,
          type: notification.type,
          result 
        });
      } catch (error) {
        logger.error(`Bulk notification failed for ${notification.id}:`, error);
        results.push({ 
          id: notification.id,
          type: notification.type,
          result: { success: false, error: error.message }
        });
      }
    }
    
    return results;
  }


  async notifyNewExpense(data) {
    const { expense, groupName, payerName } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping new expense notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      // Prepare split data for email
      const splits = expense.splits.map(split => ({
        memberName: split.memberId.name,
        amount: split.amount.toFixed(2),
        percentage: split.percentage || (split.amount / expense.amount * 100).toFixed(1)
      }));

      const template = emailTemplates.expenseCreated({
        payerName,
        amount: expense.amount.toFixed(2),
        description: expense.description,
        groupName,
        splits
      });

      // Send to all group members except the payer
      const notifications = [];
      for (const split of expense.splits) {
        if (split.memberId._id.toString() !== expense.payerId._id.toString()) {
          const result = await this.sendEmail(
            split.memberId.email,
            template.subject,
            template.html,
            template.text
          );
          notifications.push({
            recipient: split.memberId.email,
            result
          });
        }
      }

      logger.info(`✅ New expense notifications sent for: ${expense.description}`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send new expense notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyExpenseSplitChanged(data) {
    const { expense, updatedBy, groupName } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping split change notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      // Get updater name
      const updater = await User.findById(updatedBy).select('name');
      const updaterName = updater ? updater.name : 'Group Admin';

      // Prepare new split data
      const newSplits = expense.splits.map(split => ({
        memberName: split.memberId.name,
        amount: split.amount.toFixed(2),
        percentage: split.percentage || (split.amount / expense.amount * 100).toFixed(1)
      }));

      const template = emailTemplates.expenseSplitChanged({
        description: expense.description,
        updatedBy: updaterName,
        groupName,
        newSplits
      });

      // Send to all group members
      const notifications = [];
      for (const split of expense.splits) {
        const result = await this.sendEmail(
          split.memberId.email,
          template.subject,
          template.html,
          template.text
        );
        notifications.push({
          recipient: split.memberId.email,
          result
        });
      }

      logger.info(`✅ Split change notifications sent for: ${expense.description}`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send split change notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifySplitPaid(data) {
    const { payerEmail, payerName, memberName, amount, description, groupName, expenseTotal, remainingAmount, isFullySettled } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping split payment notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.splitPaid({
        payerName,
        memberName,
        amount,
        description,
        groupName,
        expenseTotal,
        remainingAmount,
        isFullySettled
      });

      const result = await this.sendEmail(
        payerEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Split payment notification sent to ${payerEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send split payment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyExpenseFullySettled(data) {
    const { groupMembers, description, groupName, totalAmount, allMemberDetails } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping expense settlement notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.expenseFullySettled({
        description,
        groupName,
        totalAmount,
        allMembers: allMemberDetails
      });

      // Send to all group members
      const notifications = [];
      for (const member of groupMembers) {
        try {
          const result = await this.sendEmail(
            member.email,
            template.subject,
            template.html,
            template.text
          );
          notifications.push({ 
            email: member.email, 
            success: result.success,
            messageId: result.messageId 
          });
        } catch (error) {
          logger.error(`Failed to send settlement notification to ${member.email}:`, error);
          notifications.push({ 
            email: member.email, 
            success: false, 
            error: error.message 
          });
        }
      }

      logger.info(`✅ Expense settlement notifications sent to ${groupMembers.length} members`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send expense settlement notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentReminder(data) {
    const { memberEmail, memberName, amount, description, groupName, daysSinceExpense, payerName } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping payment reminder');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.paymentReminder({
        memberName,
        amount,
        description,
        groupName,
        daysSinceExpense,
        payerName
      });

      const result = await this.sendEmail(
        memberEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Payment reminder sent to ${memberEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send payment reminder error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyNewExpense(data) {
    const { expense, groupName, payerName } = data;
    
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping new expense notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      // Notify all group members except the payer
      const notifications = [];
      for (const split of expense.splits) {
        // Skip the payer (they already know they paid)
        if (split.memberId._id.toString() === expense.payerId._id.toString()) {
          continue;
        }

        const template = emailTemplates.expenseCreated({
          payerName,
          amount: expense.amount,
          description: expense.description,
          groupName,
          memberShare: split.amount,
          memberName: split.memberId.name
        });

        try {
          const result = await this.sendEmail(
            split.memberId.email,
            template.subject,
            template.html.replace('${split.amount}', split.amount).replace('${split.memberName}', split.memberId.name),
            template.text
          );
          
          notifications.push({ 
            email: split.memberId.email, 
            success: result.success,
            messageId: result.messageId 
          });
        } catch (error) {
          logger.error(`Failed to send expense notification to ${split.memberId.email}:`, error);
          notifications.push({ 
            email: split.memberId.email, 
            success: false, 
            error: error.message 
          });
        }
      }

      logger.info(`✅ New expense notifications sent to ${notifications.length} members`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send new expense notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkPaymentReminders(groupId, daysThreshold = 3) {
    try {
      const Expense = require('../../models/Expense');
      const Group = require('../../models/Group');
      
      // Find group with members
      const group = await Group.findById(groupId).populate('members.userId', 'name email');
      if (!group) {
        throw new Error('Group not found');
      }

      // Find unpaid expenses older than threshold
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      const unpaidExpenses = await Expense.find({
        groupId,
        isSettled: false,
        date: { $lte: thresholdDate }
      }).populate('payerId', 'name email')
        .populate('splits.memberId', 'name email');

      const reminders = [];
      
      for (const expense of unpaidExpenses) {
        const daysSinceExpense = Math.floor((new Date() - expense.date) / (1000 * 60 * 60 * 24));
        
        // Send reminders to unpaid members
        for (const split of expense.splits) {
          if (!split.paid) {
            try {
              const result = await this.sendPaymentReminder({
                memberEmail: split.memberId.email,
                memberName: split.memberId.name,
                amount: split.amount,
                description: expense.description,
                groupName: group.name,
                daysSinceExpense,
                payerName: expense.payerId.name
              });
              
              reminders.push({
                expenseId: expense._id,
                memberId: split.memberId._id,
                memberEmail: split.memberId.email,
                success: result.success
              });
            } catch (error) {
              logger.error(`Failed to send reminder to ${split.memberId.email}:`, error);
            }
          }
        }
      }

      logger.info(`✅ Sent ${reminders.length} payment reminders for group ${groupId}`);
      return { success: true, reminders, totalExpenses: unpaidExpenses.length };
    } catch (error) {
      logger.error('❌ Send bulk payment reminders error:', error);
      return { success: false, error: error.message };
    }
  }

// Core notification creation and delivery
  async createAndDeliverNotification(notificationData) {
    try {
      // Create notification in database
      const notification = new Notification({
        ...notificationData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      await notification.save();
      
      // Populate for delivery
      const populatedNotification = await Notification
        .findById(notification._id)
        .populate('data.actorId', 'name profilePicture')
        .populate('groupId', 'name')
        .lean();
      
      // Deliver via WebSocket if user is connected
      let delivered = false;
      try {
        const webSocketService = webSocketService || require('./WebSocketService'); 
        delivered = webSocketService.sendToUser(
          notificationData.recipientId, 
          'notification:new', 
          populatedNotification
        );
        
        // Mark as delivered via websocket
        if (delivered) {
          await notification.markAsDelivered('websocket');
        }
      } catch (wsError) {
        console.warn('WebSocket delivery failed:', wsError.message);
      }
      
      // Emit notification created event for other services
      eventBus.safeEmit('notification.created', {
        notification: populatedNotification,
        delivered,
        deliveryMethod: delivered ? 'websocket' : 'stored'
      });
      
      console.log(`📢 Notification created: ${notification.type} for user ${notificationData.recipientId}`);
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Event Handlers
  async handleTaskAssigned(data) {
    const { task, assignedUser, assignedBy } = data;
    
    if (task.assignedTo.toString() === assignedBy._id.toString()) {
      return; // Don't notify if user assigned to themselves
    }
    
    await this.createAndDeliverNotification({
      recipientId: task.assignedTo,
      groupId: task.groupId,
      type: NotificationTypes.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `${assignedBy.name} assigned you "${task.title}"`,
      data: {
        taskId: task._id,
        actorId: assignedBy._id,
        actorName: assignedBy.name,
        dueDate: task.dueDate,
        priority: task.priority,
        actionUrl: `/tasks/${task._id}`
      },
      priority: task.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
    });

    // Also broadcast to group for awareness
    eventBus.safeEmit('notification.broadcast', {
      groupId: task.groupId,
      notification: {
        type: 'task_assigned',
        message: `${assignedBy.name} assigned "${task.title}" to ${assignedUser.name}`,
        taskId: task._id
      }
    });
  }

  async handleTaskCompleted(data) {
    const { task, completedBy, groupMembers } = data;
    
    // Notify all group members except the one who completed it
    const notifications = [];
    
    for (const member of groupMembers) {
      if (member.userId._id.toString() !== completedBy._id.toString()) {
        const notification = await this.createAndDeliverNotification({
          recipientId: member.userId._id,
          groupId: task.groupId,
          type: NotificationTypes.TASK_COMPLETED,
          title: 'Task Completed',
          message: `${completedBy.name} completed "${task.title}"`,
          data: {
            taskId: task._id,
            actorId: completedBy._id,
            actorName: completedBy.name,
            actionUrl: `/tasks/${task._id}`
          },
          priority: NotificationPriority.LOW
        });
        
        notifications.push(notification);
      }
    }
    
    return notifications;
  }

  async handleTaskDueSoon(data) {
    const { task, user } = data;
    
    await this.createAndDeliverNotification({
      recipientId: task.assignedTo,
      groupId: task.groupId,
      type: NotificationTypes.TASK_DUE_SOON,
      title: 'Task Due Soon',
      message: `"${task.title}" is due ${this.formatDueTime(task.dueDate)}`,
      data: {
        taskId: task._id,
        dueDate: task.dueDate,
        actionUrl: `/tasks/${task._id}`
      },
      priority: NotificationPriority.HIGH
    });
  }

  async handleAITasksConfirmed(data) {
    const { tasks, userId, originalText } = data;
    
    await this.createAndDeliverNotification({
      recipientId: userId,
      groupId: data.groupId,
      type: NotificationTypes.AI_TASKS_READY,
      title: 'AI Tasks Created',
      message: `Created ${tasks.length} tasks from your voice input`,
      data: {
        taskCount: tasks.length,
        originalText: originalText.substring(0, 100),
        taskIds: tasks.map(t => t._id),
        actionUrl: '/tasks'
      },
      priority: NotificationPriority.MEDIUM
    });
  }

  async handleAIProcessingCompleted(data) {
    const { result, userId } = data;
    
    // Send real-time update about AI processing completion
    try {
      const webSocketService = require('./WebSocketService');
      webSocketService.sendToUser(userId, 'ai:processing_completed', {
        suggestedTasks: result.suggestedTasks,
        confidence: result.confidence,
        memberMentions: result.memberMentions,
        processingTime: result.processingTime
      });
    } catch (error) {
      console.warn('Failed to send AI processing completion to user:', error.message);
    }
  }

  async handleExpenseAdded(data) {
    const { expense, addedBy, groupMembers } = data;
    
    // Notify all group members except the one who added it
    for (const member of groupMembers) {
      if (member.userId._id.toString() !== addedBy._id.toString()) {
        await this.createAndDeliverNotification({
          recipientId: member.userId._id,
          groupId: expense.groupId,
          type: NotificationTypes.EXPENSE_ADDED,
          title: 'New Expense Added',
          message: `${addedBy.name} added expense: ${expense.description} (${expense.amount.toFixed(2)})`,
          data: {
            expenseId: expense._id,
            actorId: addedBy._id,
            actorName: addedBy.name,
            amount: expense.amount,
            actionUrl: `/expenses/${expense._id}`
          },
          priority: expense.amount > 50 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
        });
      }
    }
  }

  async handleExpenseSplitPaid(data) {
    const { expense, paidBy, payerId } = data;
    
    // Notify the expense creator
    if (expense.payerId.toString() !== paidBy._id.toString()) {
      await this.createAndDeliverNotification({
        recipientId: expense.payerId,
        groupId: expense.groupId,
        type: NotificationTypes.EXPENSE_SPLIT_PAID,
        title: 'Payment Received',
        message: `${paidBy.name} paid their share for "${expense.description}"`,
        data: {
          expenseId: expense._id,
          actorId: paidBy._id,
          actorName: paidBy.name,
          actionUrl: `/expenses/${expense._id}`
        },
        priority: NotificationPriority.LOW
      });
    }
  }

  async handleGroupMemberJoined(data) {
    const { group, newMember, existingMembers } = data;
    
    // Notify all existing members
    for (const member of existingMembers) {
      if (member.userId._id.toString() !== newMember._id.toString()) {
        await this.createAndDeliverNotification({
          recipientId: member.userId._id,
          groupId: group._id,
          type: NotificationTypes.GROUP_MEMBER_JOINED,
          title: 'New Member Joined',
          message: `${newMember.name} joined ${group.name}`,
          data: {
            actorId: newMember._id,
            actorName: newMember.name,
            actionUrl: `/groups/${group._id}`
          },
          priority: NotificationPriority.LOW
        });
      }
    }
  }

  // Utility methods
  formatDueTime(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = Math.floor((due - now) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'in less than an hour';
    if (diffInHours < 24) return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  }

  // REST API methods
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null,
      groupId = null
    } = options;
    
    const filter = { recipientId: userId };
    if (unreadOnly) filter.isRead = false;
    if (type) filter.type = type;
    if (groupId) filter.groupId = groupId;
    
    const notifications = await Notification
      .find(filter)
      .populate('data.actorId', 'name profilePicture')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Notification.countDocuments(filter);
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (notification) {
      // Send real-time update
      try {
        const webSocketService = require('./WebSocketService');
        webSocketService.sendToUser(userId, 'notification:read', {
          notificationId,
          readAt: notification.readAt
        });
      } catch (error) {
        console.warn('Failed to send read update via WebSocket:', error.message);
      }
    }
    
    return notification;
  }

  async markAllAsRead(userId, groupId = null) {
    const filter = { recipientId: userId, isRead: false };
    if (groupId) filter.groupId = groupId;
    
    const result = await Notification.updateMany(
      filter,
      { isRead: true, readAt: new Date() }
    );
    
    if (result.modifiedCount > 0) {
      // Send real-time update
      try {
        const webSocketService = require('./WebSocketService');
        webSocketService.sendToUser(userId, 'notification:all_read', {
          groupId,
          readCount: result.modifiedCount
        });
      } catch (error) {
        console.warn('Failed to send all-read update via WebSocket:', error.message);
      }
    }
    
    return result;
  }

  async getUnreadCount(userId, groupId = null) {
    const filter = { recipientId: userId, isRead: false };
    if (groupId) filter.groupId = groupId;
    
    return await Notification.countDocuments(filter);
  }

  // Cleanup method for graceful shutdown
  cleanup() {
    eventBus.removeAllListeners();
    console.log('🧹 NotificationService cleaned up');
  }
}

module.exports = new NotificationService();
    // Expense Events - using your existing handlers
    eventBus.on(EventTypes.EXPENSE_ADDED, (data) => this.handleExpenseAdded(data));
    eventBus.on(EventTypes.EXPENSE_CREATED, (data) => this.handleExpenseAdded(data)); // Alias
    eventBus.on(EventTypes.EXPENSE_SPLIT_PAID, (data) => this.handleExpenseSplitPaid(data));

    // New expense events - create simple handlers
    eventBus.on(EventTypes.EXPENSE_UPDATED, (data) => this.handleExpenseUpdated(data));
    eventBus.on(EventTypes.EXPENSE_DELETED, (data) => this.handleExpenseDeleted(data));
    eventBus.on(EventTypes.EXPENSE_FULLY_SETTLED, (data) => this.handleExpenseFullySettled(data));
    eventBus.on(EventTypes.EXPENSE_SPLITS_CHANGED, (data) => this.handleExpenseSplitsChanged(data));

    // Group Events - using your existing handlers
    eventBus.on(EventTypes.GROUP_MEMBER_JOINED, (data) => this.handleGroupMemberJoined(data));

    // New group events - create simple handlers
    eventBus.on(EventTypes.GROUP_CREATED, (data) => this.handleGroupCreated(data));
    eventBus.on(EventTypes.GROUP_UPDATED, (data) => this.handleGroupUpdated(data));
    eventBus.on(EventTypes.GROUP_MEMBER_LEFT, (data) => this.handleGroupMemberLeft(data));
    eventBus.on(EventTypes.GROUP_MEMBER_REMOVED, (data) => this.handleGroupMemberRemoved(data));
    eventBus.on(EventTypes.GROUP_ADMIN_TRANSFERRED, (data) => this.handleGroupAdminTransferred(data));
    eventBus.on(EventTypes.GROUP_EMAIL_INVITATION_SENT, (data) => this.handleGroupEmailInvitationSent(data));

    console.log('✅ NotificationService event listeners registered');
  }

  // Add these simple handler methods to your NotificationService class
  // (only the new ones - keep your existing handlers as they are)

  async handleTaskCreated(data) {
    const { task, assignedUser, createdBy, groupId } = data;

    try {
      // Create in-app notification for assigned user (if different from creator)
      if (assignedUser && assignedUser._id.toString() !== createdBy._id.toString()) {
        await this.createAndDeliverNotification({
          recipientId: assignedUser._id,
          groupId: task.groupId._id,
          type: NotificationTypes.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: `${createdBy.name} assigned you "${task.title}"`,
          data: {
            taskId: task._id,
            actorId: createdBy._id,
            actorName: createdBy.name,
            dueDate: task.dueDate,
            priority: task.priority,
            actionUrl: `/tasks/${task._id}`
          },
          priority: task.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
        });
      }

      // Send WebSocket update for group activity
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'TASK_CREATED',
          message: `${createdBy.name} created task: "${task.title}"`,
          actor: createdBy.name,
          taskId: task._id
        });
      }

    } catch (error) {
      console.error('Error handling task created event:', error);
    }
  }

  async handleTaskUpdated(data) {
    const { updatedTask, updater, groupId } = data;

    try {
      // Send WebSocket update for group activity
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'TASK_UPDATED',
          message: `${updater.name} updated task: "${updatedTask.title}"`,
          actor: updater.name,
          taskId: updatedTask._id
        });
      }
    } catch (error) {
      console.error('Error handling task updated event:', error);
    }
  }

  async handleTaskDeleted(data) {
    const { task, deletedBy, groupId } = data;

    try {
      // Get deleter name
      const deleter = await User.findById(deletedBy).select('name');

      // Send WebSocket update for group activity
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'TASK_DELETED',
          message: `${deleter.name} deleted task: "${task.title}"`,
          actor: deleter.name
        });
      }
    } catch (error) {
      console.error('Error handling task deleted event:', error);
    }
  }

  async handleExpenseUpdated(data) {
    const { updatedExpense, updatedBy, groupId } = data;

    try {
      // Get updater name
      const updater = await User.findById(updatedBy).select('name');

      // Send WebSocket update for group activity
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'EXPENSE_UPDATED',
          message: `${updater.name} updated expense: ${updatedExpense.description}`,
          actor: updater.name,
          expenseId: updatedExpense._id
        });
      }
    } catch (error) {
      console.error('Error handling expense updated event:', error);
    }
  }

  async handleExpenseDeleted(data) {
    const { expense, deletedBy, groupId } = data;

    try {
      // Get deleter name
      const deleter = await User.findById(deletedBy).select('name');

      // Send WebSocket update for group activity
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'EXPENSE_DELETED',
          message: `${deleter.name} deleted expense: "${expense.description}"`,
          actor: deleter.name
        });
      }
    } catch (error) {
      console.error('Error handling expense deleted event:', error);
    }
  }

  async handleExpenseFullySettled(data) {
    const { expense, groupId } = data;

    try {
      // Send WebSocket celebration update
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'EXPENSE_SETTLED',
          message: `🎉 "${expense.description}" is fully settled!`,
          expenseId: expense._id
        });
      }
    } catch (error) {
      console.error('Error handling expense fully settled event:', error);
    }
  }

  async handleExpenseSplitsChanged(data) {
    const { expense, updatedBy, groupId } = data;

    try {
      // Get updater name
      const updater = await User.findById(updatedBy).select('name');

      // Send WebSocket update
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(groupId, 'group_activity', {
          type: 'SPLITS_CHANGED',
          message: `${updater.name} updated splits for "${expense.description}"`,
          actor: updater.name,
          expenseId: expense._id
        });
      }
    } catch (error) {
      console.error('Error handling expense splits changed event:', error);
    }
  }

  async handleGroupCreated(data) {
    const { group, creator } = data;

    try {
      // Could send welcome notification or other group creation logic
      console.log(`Group "${group.name}" created by ${creator.name}`);
    } catch (error) {
      console.error('Error handling group created event:', error);
    }
  }

  async handleGroupUpdated(data) {
    const { group, updatedBy } = data;

    try {
      // Get updater name
      const updater = await User.findById(updatedBy).select('name');

      // Send WebSocket update
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
          type: 'GROUP_UPDATED',
          message: `${updater.name} updated group settings`,
          actor: updater.name
        });
      }
    } catch (error) {
      console.error('Error handling group updated event:', error);
    }
  }

  async handleGroupMemberLeft(data) {
    const { group, leftMember } = data;

    try {
      // Get member name
      const member = await User.findById(leftMember).select('name');

      // Send WebSocket update
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
          type: 'MEMBER_LEFT',
          message: `${member.name} left the group`,
          actor: member.name
        });
      }
    } catch (error) {
      console.error('Error handling group member left event:', error);
    }
  }

  async handleGroupMemberRemoved(data) {
    const { group, removedMember, removedBy } = data;

    try {
      // Get remover name
      const remover = await User.findById(removedBy).select('name');

      // Send WebSocket update
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
          type: 'MEMBER_REMOVED',
          message: `${remover.name} removed ${removedMember.name} from the group`,
          actor: remover.name
        });
      }

      // Send notification to removed member
      await this.createAndDeliverNotification({
        recipientId: removedMember._id,
        groupId: group._id,
        type: NotificationTypes.GROUP_MEMBER_LEFT,
        title: 'Removed from Group',
        message: `You were removed from "${group.name}" by ${remover.name}`,
        data: {
          actorId: removedBy,
          actorName: remover.name
        },
        priority: NotificationPriority.HIGH
      });

    } catch (error) {
      console.error('Error handling group member removed event:', error);
    }
  }

  async handleGroupAdminTransferred(data) {
    const { group, oldAdmin, newAdmin } = data;

    try {
      // Send notification to new admin
      await this.createAndDeliverNotification({
        recipientId: newAdmin._id,
        groupId: group._id,
        type: NotificationTypes.GROUP_ROLE_CHANGED,
        title: 'You are now an Admin',
        message: `${oldAdmin.name} transferred admin rights to you for "${group.name}"`,
        data: {
          actorId: oldAdmin._id,
          actorName: oldAdmin.name
        },
        priority: NotificationPriority.HIGH
      });

      // Send WebSocket update
      if (this.socketHandler) {
        this.socketHandler.broadcastToGroup(group._id, 'group_activity', {
          type: 'ADMIN_TRANSFERRED',
          message: `${oldAdmin.name} made ${newAdmin.name} the new admin`,
          actor: oldAdmin.name
        });
      }

    } catch (error) {
      console.error('Error handling group admin transferred event:', error);
    }
  }

  async handleGroupEmailInvitationSent(data) {
    const { recipientEmail, inviter, group } = data;

    try {
      // Just log the invitation was sent (email already sent by service)
      console.log(`Email invitation sent to ${recipientEmail} for group "${group.name}" by ${inviter.name}`);
    } catch (error) {
      console.error('Error handling group email invitation sent event:', error);
    }
  }

  async handleAITasksSuggested(data) {
    const { userId, result } = data;

    try {
      // Send real-time update about AI suggestions
      if (this.socketHandler) {
        this.socketHandler.sendToUser(userId, 'ai:tasks_suggested', {
          suggestedTasks: result.suggestedTasks,
          confidence: result.confidence,
          memberMentions: result.memberMentions,
          processingTime: result.processingTime
        });
      }
    } catch (error) {
      console.error('Error handling AI tasks suggested event:', error);
    }
  }


  checkEmailConfig() {
    // Check environment variables directly
    const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    logger.debug('Email credentials check:', hasCredentials);
    return hasCredentials;
  }

  async sendEmail(to, subject, html, text) {
    logger.info(`📧 Attempting to send email to: ${to}`);

    // Check if we have email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('⚠️ Email credentials not configured');
      return {
        success: false,
        reason: 'Email credentials not configured'
      };
    }

    // Get transporter
    const transporter = emailConfig.getTransporter();

    if (!transporter) {
      logger.error('⚠️ Email transporter is null');
      return {
        success: false,
        reason: 'Email transporter not available'
      };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Roomy App',
          address: process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        text
      };

      logger.info('📤 Sending email...');
      const info = await transporter.sendMail(mailOptions);

      logger.info(`✅ Email sent successfully to ${to}:`, info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        to: to
      };
    } catch (error) {
      logger.error('❌ Email sending failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendGroupInvitation(data) {
    const { recipientEmail, inviterName, groupName, inviteCode } = data;

    try {
      const appBaseUrl = process.env.APP_BASE_URL || 'https://roomy.app';

      const template = emailTemplates.groupInvitation({
        inviterName,
        groupName,
        inviteCode,
        appBaseUrl
      });

      const result = await this.sendEmail(
        recipientEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Group invitation sent to ${recipientEmail} for group ${groupName}`);
      } else {
        logger.warn(`⚠️ Group invitation failed to ${recipientEmail}:`, result.reason || result.error);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send group invitation error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeToGroup(data) {
    const { userEmail, userName, groupName, memberCount, adminName } = data;

    try {
      const template = emailTemplates.welcomeToGroup({
        userName,
        groupName,
        memberCount,
        adminName
      });

      const result = await this.sendEmail(
        userEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`Welcome email sent to ${userEmail} for group ${groupName}`);
      }

      return result;
    } catch (error) {
      logger.error('Send welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRoleChangeNotification(data) {
    const { userEmail, userName, groupName, newRole, changedBy } = data;

    try {
      const template = emailTemplates.roleChanged({
        userName,
        groupName,
        newRole,
        changedBy
      });

      const result = await this.sendEmail(
        userEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`Role change notification sent to ${userEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('Send role change notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // In-app notification methods (for future real-time notifications)
  async sendInAppNotification(userId, notification) {
    // This would integrate with WebSocket or push notification service
    // For now, just log it
    logger.info(`In-app notification for user ${userId}:`, notification);

    return {
      success: true,
      type: 'in-app',
      userId,
      notification
    };
  }

  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId
      });

      if (result) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:deleted', {
            notificationId
          });
        } catch (error) {
          console.warn('Failed to send delete update via WebSocket:', error.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotificationStats(userId, timeframe = '7d') {
    try {
      const days = parseInt(timeframe.replace('d', ''));
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [totalStats, typeStats, priorityStats, readStats] = await Promise.all([
        // Total notifications
        Notification.countDocuments({
          recipientId: userId,
          createdAt: { $gte: startDate }
        }),

        // By type
        Notification.aggregate([
          {
            $match: {
              recipientId: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
            }
          }
        ]),

        // By priority
        Notification.aggregate([
          {
            $match: {
              recipientId: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ]),

        // Read/unread stats
        Notification.aggregate([
          {
            $match: {
              recipientId: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              read: { $sum: { $cond: ['$isRead', 1, 0] } },
              avgReadTime: {
                $avg: {
                  $cond: [
                    '$readAt',
                    { $subtract: ['$readAt', '$createdAt'] },
                    null
                  ]
                }
              }
            }
          }
        ])
      ]);

      const readData = readStats[0] || { total: 0, read: 0, avgReadTime: 0 };

      return {
        timeframe,
        total: totalStats,
        unread: totalStats - readData.read,
        readRate: totalStats > 0 ? (readData.read / totalStats * 100).toFixed(1) : '0.0',
        avgReadTimeMinutes: readData.avgReadTime ? Math.round(readData.avgReadTime / (1000 * 60)) : 0,
        byType: typeStats.reduce((acc, item) => {
          acc[item._id] = { total: item.count, unread: item.unread };
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  async getNotificationsByType(userId, type, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;

      const filter = {
        recipientId: userId,
        type: type
      };

      const notifications = await Notification
        .find(filter)
        .populate('data.actorId', 'name profilePicture')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await Notification.countDocuments(filter);

      return {
        notifications,
        type,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      };
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw error;
    }
  }

  async getNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId).select('notificationPreferences');

      // Default preferences if none exist
      const defaultPreferences = {
        email: {
          taskAssigned: true,
          taskCompleted: true,
          taskDueSoon: true,
          expenseAdded: true,
          expenseSplitPaid: true,
          groupMemberJoined: false,
          aiTasksReady: true
        },
        push: {
          taskAssigned: true,
          taskCompleted: false,
          taskDueSoon: true,
          expenseAdded: true,
          expenseSplitPaid: true,
          groupMemberJoined: false,
          aiTasksReady: true
        },
        inApp: {
          taskAssigned: true,
          taskCompleted: true,
          taskDueSoon: true,
          expenseAdded: true,
          expenseSplitPaid: true,
          groupMemberJoined: true,
          aiTasksReady: true
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      };

      return user?.notificationPreferences || defaultPreferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences: preferences },
        { new: true, runValidators: true }
      ).select('notificationPreferences');

      return user.notificationPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async createGroupBroadcast(data) {
    try {
      const { groupId, message, type, broadcastBy } = data;

      // Get group members
      const Group = require('../../models/Group');
      const group = await Group.findById(groupId).populate('members.userId', 'name email');

      if (!group) {
        throw new Error('Group not found');
      }

      const broadcaster = await User.findById(broadcastBy).select('name');
      const broadcasterName = broadcaster ? broadcaster.name : 'Group Admin';

      // Create notifications for all group members except broadcaster
      const notifications = [];

      for (const member of group.members) {
        if (member.userId._id.toString() !== broadcastBy.toString()) {
          const notification = await this.createAndDeliverNotification({
            recipientId: member.userId._id,
            groupId: groupId,
            type: type || NotificationTypes.SYSTEM_ANNOUNCEMENT,
            title: '📢 Group Announcement',
            message: message,
            data: {
              actorId: broadcastBy,
              actorName: broadcasterName,
              broadcastType: type,
              actionUrl: `/groups/${groupId}`
            },
            priority: NotificationPriority.MEDIUM
          });

          notifications.push(notification);
        }
      }

      return {
        broadcastId: notifications[0]?._id,
        groupId,
        message,
        recipientCount: notifications.length
      };
    } catch (error) {
      console.error('Error creating group broadcast:', error);
      throw error;
    }
  }

  async sendDirectNotification(data) {
    try {
      const { senderId, recipientId, title, message, type, priority } = data;

      const sender = await User.findById(senderId).select('name');
      const senderName = sender ? sender.name : 'User';

      const notification = await this.createAndDeliverNotification({
        recipientId: recipientId,
        type: type || 'DIRECT_MESSAGE',
        title: title,
        message: message,
        data: {
          actorId: senderId,
          actorName: senderName,
          isDirect: true
        },
        priority: priority || NotificationPriority.MEDIUM
      });

      return notification;
    } catch (error) {
      console.error('Error sending direct notification:', error);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [total, last24hCount, last7dCount, unreadCount, typeDistribution] = await Promise.all([
        Notification.countDocuments({}),
        Notification.countDocuments({ createdAt: { $gte: last24h } }),
        Notification.countDocuments({ createdAt: { $gte: last7d } }),
        Notification.countDocuments({ isRead: false }),
        Notification.aggregate([
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ])
      ]);

      return {
        total,
        last24h: last24hCount,
        last7d: last7dCount,
        unread: unreadCount,
        readRate: total > 0 ? ((total - unreadCount) / total * 100).toFixed(1) : '0.0',
        typeDistribution: typeDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  async bulkMarkAsRead(userId, notificationIds) {
    try {
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipientId: userId,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      if (result.modifiedCount > 0) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:bulk_read', {
            notificationIds,
            readCount: result.modifiedCount
          });
        } catch (error) {
          console.warn('Failed to send bulk read update via WebSocket:', error.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      throw error;
    }
  }

  async bulkDeleteByIds(userId, notificationIds) {
    try {
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipientId: userId
      });

      if (result.deletedCount > 0) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:bulk_deleted', {
            notificationIds,
            deletedCount: result.deletedCount
          });
        } catch (error) {
          console.warn('Failed to send bulk delete update via WebSocket:', error.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      throw error;
    }
  }

  async bulkDeleteOlderThan(userId, olderThanDays) {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      const result = await Notification.deleteMany({
        recipientId: userId,
        createdAt: { $lt: cutoffDate }
      });

      if (result.deletedCount > 0) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:bulk_deleted', {
            olderThanDays,
            deletedCount: result.deletedCount
          });
        } catch (error) {
          console.warn('Failed to send bulk delete update via WebSocket:', error.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Error bulk deleting old notifications:', error);
      throw error;
    }
  }

  async getNotificationTimeline(userId, options = {}) {
    try {
      const { days = 7, groupId } = options;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const filter = {
        recipientId: userId,
        createdAt: { $gte: startDate }
      };

      if (groupId) {
        filter.groupId = groupId;
      }

      const timeline = await Notification.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type'
            },
            count: { $sum: 1 },
            notifications: { $push: '$$ROOT' }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            types: {
              $push: {
                type: '$_id.type',
                count: '$count',
                notifications: '$notifications'
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      return {
        timeframe: `${days}d`,
        timeline: timeline.map(day => ({
          date: day._id,
          totalCount: day.totalCount,
          types: day.types
        }))
      };
    } catch (error) {
      console.error('Error getting notification timeline:', error);
      throw error;
    }
  }

  async snoozeNotification(notificationId, userId, snoozeUntil) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: userId
        },
        {
          isSnoozed: true,
          snoozedUntil: new Date(snoozeUntil),
          snoozeCount: { $inc: 1 }
        },
        { new: true }
      );

      if (notification) {
        // Send real-time update
        try {
          const webSocketService = require('./WebSocketService');
          webSocketService.sendToUser(userId, 'notification:snoozed', {
            notificationId,
            snoozedUntil: snoozeUntil
          });
        } catch (error) {
          console.warn('Failed to send snooze update via WebSocket:', error.message);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error snoozing notification:', error);
      throw error;
    }
  }

  async getNotificationDigest(userId, period = 'daily') {
    try {
      let startDate, endDate;
      const now = new Date();

      if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'weekly') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
      }

      const [notifications, stats] = await Promise.all([
        Notification.find({
          recipientId: userId,
          createdAt: { $gte: startDate, $lt: endDate }
        })
          .populate('data.actorId', 'name')
          .populate('groupId', 'name')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),

        Notification.aggregate([
          {
            $match: {
              recipientId: mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
            }
          }
        ])
      ]);

      const summary = {
        period,
        startDate,
        endDate,
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
        byType: stats.reduce((acc, stat) => {
          acc[stat._id] = { total: stat.count, unread: stat.unread };
          return acc;
        }, {}),
        highlights: notifications.slice(0, 5) // Top 5 most recent
      };

      return {
        summary,
        notifications: notifications.slice(0, 20) // Last 20 for digest
      };
    } catch (error) {
      console.error('Error getting notification digest:', error);
      throw error;
    }
  }


  async notifyGroupMembersOfNewJoin(groupMembers, newMemberName, groupName) {
    const notifications = [];

    for (const member of groupMembers) {
      try {
        const notification = await this.sendInAppNotification(member.userId, {
          type: 'member_joined',
          title: 'New member joined!',
          message: `${newMemberName} joined ${groupName}`,
          timestamp: new Date(),
          groupId: member.groupId
        });

        notifications.push(notification);
      } catch (error) {
        logger.error(`Failed to notify member ${member.userId}:`, error);
      }
    }

    return notifications;
  }




  async notifyTaskReassignment(data) {
    const { newAssigneeEmail, newAssigneeName, taskTitle, reassignedBy, groupName, dueDate, priority } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task reassignment notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.taskReassigned({
        newAssigneeName,
        taskTitle,
        reassignedBy,
        groupName,
        dueDate,
        priority
      });

      const result = await this.sendEmail(
        newAssigneeEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Task reassignment notification sent to ${newAssigneeEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send task reassignment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTaskUpdate(data) {
    const { assigneeEmail, assigneeName, taskTitle, updatedBy, groupName, changes } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task update notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.taskUpdated({
        assigneeName,
        taskTitle,
        updatedBy,
        groupName,
        changes
      });

      const result = await this.sendEmail(
        assigneeEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Task update notification sent to ${assigneeEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send task update notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTaskCompletion(data) {
    const { creatorEmail, creatorName, taskTitle, completedBy, groupName, actualDuration } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task completion notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.taskCompleted({
        creatorName,
        taskTitle,
        completedBy,
        groupName,
        actualDuration
      });

      const result = await this.sendEmail(
        creatorEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Task completion notification sent to ${creatorEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send task completion notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTaskDueSoon(data) {
    const { assigneeEmail, assigneeName, taskTitle, groupName, dueDate } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping due date reminder');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const now = new Date();
      const due = new Date(dueDate);
      const hoursUntilDue = Math.round((due - now) / (1000 * 60 * 60));

      const template = emailTemplates.taskDueSoon({
        assigneeName,
        taskTitle,
        groupName,
        dueDate,
        hoursUntilDue
      });

      const result = await this.sendEmail(
        assigneeEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Task due reminder sent to ${assigneeEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send task due reminder error:', error);
      return { success: false, error: error.message };
    }
  }


  async notifyTaskAssignment(assigneeEmail, assigneeName, taskTitle, assignedBy, groupName, taskDetails = {}) {
    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping task assignment notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const { dueDate, priority, description, estimatedDuration } = taskDetails;

      const subject = `📋 New task assigned: "${taskTitle}"`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .task-card { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .priority-badge { background-color: ${priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">📋 New Task Assigned</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName}!</h2>
              <p><strong>${assignedBy}</strong> assigned you a new task in <strong>${groupName}</strong>:</p>
              
              <div class="task-card">
                <h3>📋 ${taskTitle}</h3>
                ${description ? `<p>${description}</p>` : ''}
                ${priority ? `<p><span class="priority-badge">${priority.toUpperCase()}</span></p>` : ''}
                ${dueDate ? `<p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
                ${estimatedDuration ? `<p><strong>Estimated time:</strong> ${estimatedDuration} minutes</p>` : ''}
              </div>

              <p>Check the Roomy app to see the full details and mark it complete when done! 🎯</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
  Hi ${assigneeName}!

  ${assignedBy} assigned you a new task in ${groupName}:

  📋 ${taskTitle}
  ${description ? `Description: ${description}` : ''}
  ${priority ? `Priority: ${priority.toUpperCase()}` : ''}
  ${dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}` : ''}
  ${estimatedDuration ? `Estimated time: ${estimatedDuration} minutes` : ''}

  Check the Roomy app to see the full details and mark it complete when done!
      `;

      const result = await this.sendEmail(assigneeEmail, subject, html, text);

      if (result.success) {
        logger.info(`✅ Enhanced task assignment notification sent to ${assigneeEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send enhanced task assignment notification error:', error);
      return { success: false, error: error.message };
    }
  }
  // Batch notification methods
  async sendBulkNotifications(notifications) {
    const results = [];

    for (const notification of notifications) {
      try {
        let result;

        switch (notification.type) {
          case 'group_invitation':
            result = await this.sendGroupInvitation(notification.data);
            break;
          case 'welcome_to_group':
            result = await this.sendWelcomeToGroup(notification.data);
            break;
          case 'role_changed':
            result = await this.sendRoleChangeNotification(notification.data);
            break;
          case 'task_assigned':
            result = await this.notifyTaskAssignment(notification.data);
            break;
          default:
            result = { success: false, error: 'Unknown notification type' };
        }

        results.push({
          id: notification.id,
          type: notification.type,
          result
        });
      } catch (error) {
        logger.error(`Bulk notification failed for ${notification.id}:`, error);
        results.push({
          id: notification.id,
          type: notification.type,
          result: { success: false, error: error.message }
        });
      }
    }

    return results;
  }


  async notifyNewExpense(data) {
    const { expense, groupName, payerName } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping new expense notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      // Prepare split data for email
      const splits = expense.splits.map(split => ({
        memberName: split.memberId.name,
        amount: split.amount.toFixed(2),
        percentage: split.percentage || (split.amount / expense.amount * 100).toFixed(1)
      }));

      const template = emailTemplates.expenseCreated({
        payerName,
        amount: expense.amount.toFixed(2),
        description: expense.description,
        groupName,
        splits
      });

      // Send to all group members except the payer
      const notifications = [];
      for (const split of expense.splits) {
        if (split.memberId._id.toString() !== expense.payerId._id.toString()) {
          const result = await this.sendEmail(
            split.memberId.email,
            template.subject,
            template.html,
            template.text
          );
          notifications.push({
            recipient: split.memberId.email,
            result
          });
        }
      }

      logger.info(`✅ New expense notifications sent for: ${expense.description}`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send new expense notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyExpenseSplitChanged(data) {
    const { expense, updatedBy, groupName } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping split change notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      // Get updater name
      const updater = await User.findById(updatedBy).select('name');
      const updaterName = updater ? updater.name : 'Group Admin';

      // Prepare new split data
      const newSplits = expense.splits.map(split => ({
        memberName: split.memberId.name,
        amount: split.amount.toFixed(2),
        percentage: split.percentage || (split.amount / expense.amount * 100).toFixed(1)
      }));

      const template = emailTemplates.expenseSplitChanged({
        description: expense.description,
        updatedBy: updaterName,
        groupName,
        newSplits
      });

      // Send to all group members
      const notifications = [];
      for (const split of expense.splits) {
        const result = await this.sendEmail(
          split.memberId.email,
          template.subject,
          template.html,
          template.text
        );
        notifications.push({
          recipient: split.memberId.email,
          result
        });
      }

      logger.info(`✅ Split change notifications sent for: ${expense.description}`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send split change notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifySplitPaid(data) {
    const { payerEmail, payerName, memberName, amount, description, groupName, expenseTotal, remainingAmount, isFullySettled } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping split payment notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.splitPaid({
        payerName,
        memberName,
        amount,
        description,
        groupName,
        expenseTotal,
        remainingAmount,
        isFullySettled
      });

      const result = await this.sendEmail(
        payerEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Split payment notification sent to ${payerEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send split payment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyExpenseFullySettled(data) {
    const { groupMembers, description, groupName, totalAmount, allMemberDetails } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping expense settlement notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.expenseFullySettled({
        description,
        groupName,
        totalAmount,
        allMembers: allMemberDetails
      });

      // Send to all group members
      const notifications = [];
      for (const member of groupMembers) {
        try {
          const result = await this.sendEmail(
            member.email,
            template.subject,
            template.html,
            template.text
          );
          notifications.push({
            email: member.email,
            success: result.success,
            messageId: result.messageId
          });
        } catch (error) {
          logger.error(`Failed to send settlement notification to ${member.email}:`, error);
          notifications.push({
            email: member.email,
            success: false,
            error: error.message
          });
        }
      }

      logger.info(`✅ Expense settlement notifications sent to ${groupMembers.length} members`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send expense settlement notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentReminder(data) {
    const { memberEmail, memberName, amount, description, groupName, daysSinceExpense, payerName } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping payment reminder');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = emailTemplates.paymentReminder({
        memberName,
        amount,
        description,
        groupName,
        daysSinceExpense,
        payerName
      });

      const result = await this.sendEmail(
        memberEmail,
        template.subject,
        template.html,
        template.text
      );

      if (result.success) {
        logger.info(`✅ Payment reminder sent to ${memberEmail}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Send payment reminder error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyNewExpense(data) {
    const { expense, groupName, payerName } = data;

    if (!this.emailEnabled) {
      logger.warn('📧 Email not configured, skipping new expense notification');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      // Notify all group members except the payer
      const notifications = [];
      for (const split of expense.splits) {
        // Skip the payer (they already know they paid)
        if (split.memberId._id.toString() === expense.payerId._id.toString()) {
          continue;
        }

        const template = emailTemplates.expenseCreated({
          payerName,
          amount: expense.amount,
          description: expense.description,
          groupName,
          memberShare: split.amount,
          memberName: split.memberId.name
        });

        try {
          const result = await this.sendEmail(
            split.memberId.email,
            template.subject,
            template.html.replace('${split.amount}', split.amount).replace('${split.memberName}', split.memberId.name),
            template.text
          );

          notifications.push({
            email: split.memberId.email,
            success: result.success,
            messageId: result.messageId
          });
        } catch (error) {
          logger.error(`Failed to send expense notification to ${split.memberId.email}:`, error);
          notifications.push({
            email: split.memberId.email,
            success: false,
            error: error.message
          });
        }
      }

      logger.info(`✅ New expense notifications sent to ${notifications.length} members`);
      return { success: true, notifications };
    } catch (error) {
      logger.error('❌ Send new expense notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkPaymentReminders(groupId, daysThreshold = 3) {
    try {
      const Expense = require('../../models/Expense');
      const Group = require('../../models/Group');

      // Find group with members
      const group = await Group.findById(groupId).populate('members.userId', 'name email');
      if (!group) {
        throw new Error('Group not found');
      }

      // Find unpaid expenses older than threshold
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      const unpaidExpenses = await Expense.find({
        groupId,
        isSettled: false,
        date: { $lte: thresholdDate }
      }).populate('payerId', 'name email')
        .populate('splits.memberId', 'name email');

      const reminders = [];

      for (const expense of unpaidExpenses) {
        const daysSinceExpense = Math.floor((new Date() - expense.date) / (1000 * 60 * 60 * 24));

        // Send reminders to unpaid members
        for (const split of expense.splits) {
          if (!split.paid) {
            try {
              const result = await this.sendPaymentReminder({
                memberEmail: split.memberId.email,
                memberName: split.memberId.name,
                amount: split.amount,
                description: expense.description,
                groupName: group.name,
                daysSinceExpense,
                payerName: expense.payerId.name
              });

              reminders.push({
                expenseId: expense._id,
                memberId: split.memberId._id,
                memberEmail: split.memberId.email,
                success: result.success
              });
            } catch (error) {
              logger.error(`Failed to send reminder to ${split.memberId.email}:`, error);
            }
          }
        }
      }

      logger.info(`✅ Sent ${reminders.length} payment reminders for group ${groupId}`);
      return { success: true, reminders, totalExpenses: unpaidExpenses.length };
    } catch (error) {
      logger.error('❌ Send bulk payment reminders error:', error);
      return { success: false, error: error.message };
    }
  }

  // Core notification creation and delivery
  async createAndDeliverNotification(notificationData) {
    try {
      // Create notification in database
      const notification = new Notification({
        ...notificationData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await notification.save();

      // Populate for delivery
      const populatedNotification = await Notification
        .findById(notification._id)
        .populate('data.actorId', 'name profilePicture')
        .populate('groupId', 'name')
        .lean();

      // Deliver via WebSocket if user is connected
      let delivered = false;
      try {
        const webSocketService = webSocketService || require('./WebSocketService');
        delivered = webSocketService.sendToUser(
          notificationData.recipientId,
          'notification:new',
          populatedNotification
        );

        // Mark as delivered via websocket
        if (delivered) {
          await notification.markAsDelivered('websocket');
        }
      } catch (wsError) {
        console.warn('WebSocket delivery failed:', wsError.message);
      }

      // Emit notification created event for other services
      eventBus.safeEmit('notification.created', {
        notification: populatedNotification,
        delivered,
        deliveryMethod: delivered ? 'websocket' : 'stored'
      });

      console.log(`📢 Notification created: ${notification.type} for user ${notificationData.recipientId}`);

      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Event Handlers
  async handleTaskAssigned(data) {
    const { task, assignedUser, assignedBy } = data;

    if (task.assignedTo.toString() === assignedBy._id.toString()) {
      return; // Don't notify if user assigned to themselves
    }

    await this.createAndDeliverNotification({
      recipientId: task.assignedTo,
      groupId: task.groupId,
      type: NotificationTypes.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `${assignedBy.name} assigned you "${task.title}"`,
      data: {
        taskId: task._id,
        actorId: assignedBy._id,
        actorName: assignedBy.name,
        dueDate: task.dueDate,
        priority: task.priority,
        actionUrl: `/tasks/${task._id}`
      },
      priority: task.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
    });

    // Also broadcast to group for awareness
    eventBus.safeEmit('notification.broadcast', {
      groupId: task.groupId,
      notification: {
        type: 'task_assigned',
        message: `${assignedBy.name} assigned "${task.title}" to ${assignedUser.name}`,
        taskId: task._id
      }
    });
  }

  async handleTaskCompleted(data) {
    const { task, completedBy, groupMembers } = data;

    // Notify all group members except the one who completed it
    const notifications = [];

    for (const member of groupMembers) {
      if (member.userId._id.toString() !== completedBy._id.toString()) {
        const notification = await this.createAndDeliverNotification({
          recipientId: member.userId._id,
          groupId: task.groupId,
          type: NotificationTypes.TASK_COMPLETED,
          title: 'Task Completed',
          message: `${completedBy.name} completed "${task.title}"`,
          data: {
            taskId: task._id,
            actorId: completedBy._id,
            actorName: completedBy.name,
            actionUrl: `/tasks/${task._id}`
          },
          priority: NotificationPriority.LOW
        });

        notifications.push(notification);
      }
    }

    return notifications;
  }

  async handleTaskDueSoon(data) {
    const { task, user } = data;

    await this.createAndDeliverNotification({
      recipientId: task.assignedTo,
      groupId: task.groupId,
      type: NotificationTypes.TASK_DUE_SOON,
      title: 'Task Due Soon',
      message: `"${task.title}" is due ${this.formatDueTime(task.dueDate)}`,
      data: {
        taskId: task._id,
        dueDate: task.dueDate,
        actionUrl: `/tasks/${task._id}`
      },
      priority: NotificationPriority.HIGH
    });
  }

  async handleAITasksConfirmed(data) {
    const { tasks, userId, originalText } = data;

    await this.createAndDeliverNotification({
      recipientId: userId,
      groupId: data.groupId,
      type: NotificationTypes.AI_TASKS_READY,
      title: 'AI Tasks Created',
      message: `Created ${tasks.length} tasks from your voice input`,
      data: {
        taskCount: tasks.length,
        originalText: originalText.substring(0, 100),
        taskIds: tasks.map(t => t._id),
        actionUrl: '/tasks'
      },
      priority: NotificationPriority.MEDIUM
    });
  }

  async handleAIProcessingCompleted(data) {
    const { result, userId } = data;

    // Send real-time update about AI processing completion
    try {
      const webSocketService = require('./WebSocketService');
      webSocketService.sendToUser(userId, 'ai:processing_completed', {
        suggestedTasks: result.suggestedTasks,
        confidence: result.confidence,
        memberMentions: result.memberMentions,
        processingTime: result.processingTime
      });
    } catch (error) {
      console.warn('Failed to send AI processing completion to user:', error.message);
    }
  }

  async handleExpenseAdded(data) {
    const { expense, addedBy, groupMembers } = data;

    // Notify all group members except the one who added it
    for (const member of groupMembers) {
      if (member.userId._id.toString() !== addedBy._id.toString()) {
        await this.createAndDeliverNotification({
          recipientId: member.userId._id,
          groupId: expense.groupId,
          type: NotificationTypes.EXPENSE_ADDED,
          title: 'New Expense Added',
          message: `${addedBy.name} added expense: ${expense.description} (${expense.amount.toFixed(2)})`,
          data: {
            expenseId: expense._id,
            actorId: addedBy._id,
            actorName: addedBy.name,
            amount: expense.amount,
            actionUrl: `/expenses/${expense._id}`
          },
          priority: expense.amount > 50 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
        });
      }
    }
  }

  async handleExpenseSplitPaid(data) {
    const { expense, paidBy, payerId } = data;

    // Notify the expense creator
    if (expense.payerId.toString() !== paidBy._id.toString()) {
      await this.createAndDeliverNotification({
        recipientId: expense.payerId,
        groupId: expense.groupId,
        type: NotificationTypes.EXPENSE_SPLIT_PAID,
        title: 'Payment Received',
        message: `${paidBy.name} paid their share for "${expense.description}"`,
        data: {
          expenseId: expense._id,
          actorId: paidBy._id,
          actorName: paidBy.name,
          actionUrl: `/expenses/${expense._id}`
        },
        priority: NotificationPriority.LOW
      });
    }
  }

  async handleGroupMemberJoined(data) {
    const { group, newMember, existingMembers } = data;

    // Notify all existing members
    for (const member of existingMembers) {
      if (member.userId._id.toString() !== newMember._id.toString()) {
        await this.createAndDeliverNotification({
          recipientId: member.userId._id,
          groupId: group._id,
          type: NotificationTypes.GROUP_MEMBER_JOINED,
          title: 'New Member Joined',
          message: `${newMember.name} joined ${group.name}`,
          data: {
            actorId: newMember._id,
            actorName: newMember.name,
            actionUrl: `/groups/${group._id}`
          },
          priority: NotificationPriority.LOW
        });
      }
    }
  }

  // Utility methods
  formatDueTime(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = Math.floor((due - now) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'in less than an hour';
    if (diffInHours < 24) return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  }

  // REST API methods
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null,
      groupId = null
    } = options;

    const filter = { recipientId: userId };
    if (unreadOnly) filter.isRead = false;
    if (type) filter.type = type;
    if (groupId) filter.groupId = groupId;

    const notifications = await Notification
      .find(filter)
      .populate('data.actorId', 'name profilePicture')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(filter);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (notification) {
      // Send real-time update
      try {
        const webSocketService = require('./WebSocketService');
        webSocketService.sendToUser(userId, 'notification:read', {
          notificationId,
          readAt: notification.readAt
        });
      } catch (error) {
        console.warn('Failed to send read update via WebSocket:', error.message);
      }
    }

    return notification;
  }

  async markAllAsRead(userId, groupId = null) {
    const filter = { recipientId: userId, isRead: false };
    if (groupId) filter.groupId = groupId;

    const result = await Notification.updateMany(
      filter,
      { isRead: true, readAt: new Date() }
    );

    if (result.modifiedCount > 0) {
      // Send real-time update
      try {
        const webSocketService = require('./WebSocketService');
        webSocketService.sendToUser(userId, 'notification:all_read', {
          groupId,
          readCount: result.modifiedCount
        });
      } catch (error) {
        console.warn('Failed to send all-read update via WebSocket:', error.message);
      }
    }

    return result;
  }

  async getUnreadCount(userId, groupId = null) {
    const filter = { recipientId: userId, isRead: false };
    if (groupId) filter.groupId = groupId;

    return await Notification.countDocuments(filter);
  }

  // Cleanup method for graceful shutdown
  cleanup() {
    eventBus.removeAllListeners();
    console.log('🧹 NotificationService cleaned up');
  }
}

module.exports = new NotificationService();