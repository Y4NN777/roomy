const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const logger = require('../utils/logger');
const notificationService = require('./notifications/notificationService');
const eventBus = require('../services/notifications/eventBus');
const { EventTypes } = require('../utils/eventTypes');

class ExpenseService {
  constructor() {
    // Keep notification service for email calls
    this.notificationService = null;
  }

  getNotificationService() {
    if (!this.notificationService) {
      this.notificationService = notificationService;
    }
    return this.notificationService;
  }

  async createExpense(expenseData, payerId) {
    try {
      // Get group with members for split calculation
      const group = await Group.findById(expenseData.groupId).populate('members.userId');
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Create expense
      const expense = new Expense({
        ...expenseData,
        payerId,
      });

      // Calculate equal splits among all group members
      expense.calculateEqualSplits(group.members);
      await expense.save();

      // Populate references
      await expense.populate([
        { path: 'payerId', select: 'name email profilePicture' },
        { path: 'splits.memberId', select: 'name email profilePicture' },
        { path: 'groupId', select: 'name' }
      ]);

      // 📧 DIRECT EMAIL CALL for new expense
      try {
        await notificationService.notifyNewExpense({
          expense,
          groupName: expense.groupId.name,
          payerName: expense.payerId.name
        });
      } catch (notificationError) {
        logger.warn('❌ New expense email failed:', notificationError);
      }

      // 📱 EVENT EMISSION for in-app + WebSocket
      eventBus.safeEmit(EventTypes.EXPENSE_CREATED, {
        expense,
        createdBy: expense.payerId,
        groupId: expense.groupId._id,
        groupMembers: group.members,
        timestamp: new Date()
      });

      // Update group statistics
      await this.updateGroupExpenseStatistics(expenseData.groupId);

      logger.info(`Expense created: ${expense.description} by user ${payerId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Create expense error:', error);
      throw error;
    }
  }

  async updateExpense(expenseId, updateData, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Get group for split recalculation
      const group = await Group.findById(expense.groupId).populate('members.userId');
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Store original amount for comparison
      const originalAmount = expense.amount;
      const originalData = {
        amount: expense.amount,
        description: expense.description,
        category: expense.category
      };

      // Update expense
      Object.assign(expense, updateData);
      
      // Recalculate splits if amount changed
      if (updateData.amount && updateData.amount !== originalAmount) {
        console.log(`💰 Amount changed from ${originalAmount} to ${updateData.amount}, recalculating splits...`);
        
        if (expense.splitType === 'percentage') {
          expense.splits.forEach(split => {
            split.amount = parseFloat(((expense.amount * split.percentage) / 100).toFixed(2));
          });
        } else {
          expense.calculateEqualSplits(group.members);
        }
      }
      
      await expense.save();

      // Populate references
      await expense.populate([
        { path: 'payerId', select: 'name email profilePicture' },
        { path: 'splits.memberId', select: 'name email profilePicture' },
        { path: 'groupId', select: 'name' }
      ]);

      // 📱 EVENT EMISSION for in-app + WebSocket (no email needed for updates)
      eventBus.safeEmit(EventTypes.EXPENSE_UPDATED, {
        originalExpense: originalData,
        updatedExpense: expense,
        updatedBy: requestingUserId,
        groupId: expense.groupId._id,
        amountChanged: updateData.amount !== originalAmount,
        timestamp: new Date()
      });

      logger.info(`Expense updated: ${expense.description} by user ${requestingUserId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Update expense error:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Get group for permission checking
      const group = await Group.findById(expense.groupId);
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      const userRole = group.findMember(requestingUserId).role;

      // Check permissions (admin or payer can delete)
      if (userRole !== 'admin' && expense.payerId.toString() !== requestingUserId) {
        throw new Error('Insufficient permissions to delete this expense');
      }

      // Store expense data before deletion
      const expenseData = {
        _id: expense._id,
        description: expense.description,
        amount: expense.amount,
        groupId: expense.groupId,
        payerId: expense.payerId
      };

      await Expense.findByIdAndDelete(expenseId);

      // 📱 EVENT EMISSION for in-app + WebSocket (no email needed for deletion)
      eventBus.safeEmit(EventTypes.EXPENSE_DELETED, {
        expense: expenseData,
        deletedBy: requestingUserId,
        groupId: expense.groupId,
        timestamp: new Date()
      });

      // Update group statistics
      await this.updateGroupExpenseStatistics(expense.groupId);

      logger.info(`Expense deleted: ${expense.description} by user ${requestingUserId}`);
      return { message: 'Expense deleted successfully' };
    } catch (error) {
      logger.error('Delete expense error:', error);
      throw error;
    }
  }

  async markSplitPaid(expenseId, memberId, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Get group for permission checking
      const group = await Group.findById(expense.groupId);
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      const userRole = group.findMember(requestingUserId).role;

      // Check permissions (admin, payer, or the member themselves)
      if (userRole !== 'admin' && 
          expense.payerId.toString() !== requestingUserId &&
          memberId !== requestingUserId) {
        throw new Error('Insufficient permissions to mark split as paid');
      }

      // Store original settlement status
      const wasSettled = expense.isSettled;

      // Mark split as paid
      expense.markSplitPaid(memberId, requestingUserId);
      await expense.save();

      // Populate references for notifications
      await expense.populate([
        { path: 'payerId', select: 'name email profilePicture' },
        { path: 'splits.memberId', select: 'name email profilePicture' },
        { path: 'groupId', select: 'name' }
      ]);

      // Get the member who just paid
      const paidMember = expense.splits.find(split => 
        split.memberId._id.toString() === memberId
      );

      // Calculate remaining amount
      const remainingAmount = expense.splits
        .filter(split => !split.paid)
        .reduce((sum, split) => sum + split.amount, 0);

      // 📧 DIRECT EMAIL CALL for split payment notification
      if (expense.payerId._id.toString() !== memberId) {
        try {
          await notificationService.notifySplitPaid({
            payerEmail: expense.payerId.email,
            payerName: expense.payerId.name,
            memberName: paidMember.memberId.name,
            amount: paidMember.amount,
            description: expense.description,
            groupName: expense.groupId.name,
            expenseTotal: expense.amount,
            remainingAmount: remainingAmount.toFixed(2),
            isFullySettled: expense.isSettled
          });
        } catch (notificationError) {
          logger.warn('❌ Split payment email failed:', notificationError);
        }
      }

      // 📱 EVENT EMISSION for in-app + WebSocket
      eventBus.safeEmit(EventTypes.EXPENSE_SPLIT_PAID, {
        expense,
        paidMember,
        paidBy: requestingUserId,
        groupId: expense.groupId._id,
        wasSettled,
        isNowSettled: expense.isSettled,
        timestamp: new Date()
      });

      // If expense just became fully settled, send celebration email
      if (!wasSettled && expense.isSettled) {
        try {
          // Get all group members for the celebration notification
          const groupWithMembers = await Group.findById(expense.groupId)
            .populate('members.userId', 'name email');

          const allMemberDetails = expense.splits.map(split => ({
            name: split.memberId.name,
            amount: split.amount.toFixed(2),
            isPayer: split.memberId._id.toString() === expense.payerId._id.toString()
          }));

          // 📧 DIRECT EMAIL CALL for settlement celebration
          await notificationService.notifyExpenseFullySettled({
            groupMembers: groupWithMembers.members.map(member => ({
              email: member.userId.email,
              name: member.userId.name
            })),
            description: expense.description,
            groupName: expense.groupId.name,
            totalAmount: expense.amount.toFixed(2),
            allMemberDetails
          });

          // 📱 ADDITIONAL EVENT for full settlement
          eventBus.safeEmit(EventTypes.EXPENSE_FULLY_SETTLED, {
            expense,
            groupId: expense.groupId._id,
            groupMembers: group.members,
            timestamp: new Date()
          });

        } catch (notificationError) {
          logger.warn('❌ Expense settlement email failed:', notificationError);
        }
      }

      logger.info(`Split marked as paid for expense ${expenseId} by user ${requestingUserId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Mark split paid error:', error);
      throw error;
    }
  }

  async sendPaymentReminders(groupId, requestingUserId, daysThreshold = 3) {
    try {
      // 📧 DIRECT EMAIL CALL for payment reminders
      const result = await notificationService.sendBulkPaymentReminders(groupId, daysThreshold);

      return {
        success: result.success,
        remindersSent: result.reminders ? result.reminders.length : 0,
        unpaidExpenses: result.totalExpenses || 0,
        details: result.reminders || []
      };
    } catch (error) {
      logger.error('Send payment reminders error:', error);
      throw error;
    }
  }

  async setCustomSplits(expenseId, customSplits, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Get group for permission checking
      const group = await Group.findById(expense.groupId).populate('members.userId');
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Set custom splits
      expense.setCustomSplits(customSplits);
      await expense.save();

      // Populate references
      await expense.populate([
        { path: 'payerId', select: 'name email profilePicture' },
        { path: 'splits.memberId', select: 'name email profilePicture' },
        { path: 'groupId', select: 'name' }
      ]);

      // 📧 DIRECT EMAIL CALL for split changes
      try {
        await notificationService.notifyExpenseSplitChanged({
          expense,
          updatedBy: requestingUserId,
          groupName: group.name
        });
      } catch (notificationError) {
        logger.warn('❌ Split change email failed:', notificationError);
      }

      // 📱 EVENT EMISSION for in-app + WebSocket
      eventBus.safeEmit(EventTypes.EXPENSE_SPLITS_CHANGED, {
        expense,
        updatedBy: requestingUserId,
        groupId: expense.groupId._id,
        customSplits,
        timestamp: new Date()
      });

      logger.info(`Custom splits set for expense ${expenseId} by admin ${requestingUserId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Set custom splits error:', error);
      throw error;
    }
  }

  // Keep all getter methods unchanged
  async getExpenses(groupId, filters = {}, requestingUserId) {
    try {
      const expenses = await Expense.getGroupExpenses(groupId, filters);
      
      return {
        expenses: expenses.map(expense => expense.toJSON()),
        total: expenses.length,
        filters: filters,
      };
    } catch (error) {
      logger.error('Get expenses error:', error);
      throw error;
    }
  }

  async getExpense(expenseId, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId)
        .populate('payerId', 'name email profilePicture')
        .populate('splits.memberId', 'name email profilePicture')
        .populate('groupId', 'name');

      if (!expense) {
        throw new Error('Expense not found');
      }

      return expense.toJSON();
    } catch (error) {
      logger.error('Get expense error:', error);
      throw error;
    }
  }

  async getGroupBalances(groupId, requestingUserId) {
    try {
      const balances = await Expense.calculateGroupBalances(groupId);
      
      const balancesWithStatus = balances.map(balance => ({
        ...balance,
        status: balance.netBalance > 0 ? 'owed' : 
                balance.netBalance < 0 ? 'owes' : 'settled',
        formattedBalance: Math.abs(balance.netBalance).toFixed(2),
        formattedOwed: balance.totalOwed.toFixed(2),
        formattedPaid: balance.totalPaid.toFixed(2)
      }));

      const totalGroupExpenses = balances.reduce((sum, balance) => sum + balance.totalPaid, 0);
      const totalCurrentDebt = balances.reduce((sum, balance) => sum + balance.totalOwed, 0);
      const averagePerMember = balances.length > 0 ? totalGroupExpenses / balances.length : 0;

      return {
        balances: balancesWithStatus,
        summary: {
          totalGroupExpenses: totalGroupExpenses.toFixed(2),
          totalCurrentDebt: totalCurrentDebt.toFixed(2),
          averagePerMember: averagePerMember.toFixed(2),
          memberCount: balances.length,
          hasOutstandingBalances: balancesWithStatus.some(b => b.status !== 'settled')
        }
      };
    } catch (error) {
      logger.error('Get group balances error:', error);
      throw error;
    }
  }

  async getExpenseStatistics(groupId, requestingUserId, period = 'month') {
    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const stats = await Expense.aggregate([
        { 
          $match: { 
            groupId: groupId,
            date: { $gte: startDate, $lte: endDate }
          } 
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' },
            settledExpenses: {
              $sum: { $cond: [{ $eq: ['$isSettled', true] }, 1, 0] }
            },
            categoryBreakdown: {
              $push: {
                category: '$category',
                amount: '$amount'
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalExpenses: 0,
        totalAmount: 0,
        averageAmount: 0,
        settledExpenses: 0,
        categoryBreakdown: []
      };

      // Process category breakdown
      const categories = {};
      result.categoryBreakdown.forEach(item => {
        if (categories[item.category]) {
          categories[item.category] += item.amount;
        } else {
          categories[item.category] = item.amount;
        }
      });

      result.categoryBreakdown = Object.entries(categories).map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2)),
        percentage: result.totalAmount > 0 ? 
          parseFloat(((amount / result.totalAmount) * 100).toFixed(1)) : 0
      }));

      // Add settlement rate
      result.settlementRate = result.totalExpenses > 0 ? 
        parseFloat(((result.settledExpenses / result.totalExpenses) * 100).toFixed(1)) : 0;

      // Format amounts
      result.totalAmount = parseFloat(result.totalAmount.toFixed(2));
      result.averageAmount = parseFloat(result.averageAmount.toFixed(2));

      return {
        period,
        dateRange: { startDate, endDate },
        statistics: result
      };
    } catch (error) {
      logger.error('Get expense statistics error:', error);
      throw error;
    }
  }

  async updateGroupExpenseStatistics(groupId) {
    try {
      const group = await Group.findById(groupId);
      if (group) {
        await group.updateStatistics();
      }
    } catch (error) {
      logger.error('Update group expense statistics error:', error);
    }
  }
}

module.exports = new ExpenseService();