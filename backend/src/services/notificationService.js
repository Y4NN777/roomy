const emailConfig = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    logger.info('🔔 NotificationService initializing...');
    // Check email configuration
    this.emailEnabled = this.checkEmailConfig();
    logger.info('📧 Email enabled in notification service:', this.emailEnabled);
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
}

module.exports = new NotificationService();