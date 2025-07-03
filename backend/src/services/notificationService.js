const emailConfig = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');
const logger = require('../utils/logger');
const User = require('../models/User');

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
      const Expense = require('../models/Expense');
      const Group = require('../models/Group');
      
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
}

module.exports = new NotificationService();