const Expense = require('../models/Expense');
const Group = require('../models/Group');
const logger = require('../utils/logger');
const notificationService = require('./notifications/notificationService');


class ExpenseService {
  async createExpense(expenseData, payerId) {
    try {
      // Get group with members for split calculation
      // Note: verifyGroupMembership middleware already verified access
      const group = await Group.findById(expenseData.groupId).populate('members.userId');
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // REMOVE THIS CHECK - middleware already verified membership
      // if (!group || !group.isMember(payerId)) {
      //   throw new Error('Access denied - not a group member');
      // }

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

      // Update group statistics
      await this.updateGroupExpenseStatistics(expenseData.groupId);

      logger.info(`Expense created: ${expense.description} by user ${payerId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Create expense error:', error);
      throw error;
    }
  }

  async getExpenses(groupId, filters = {}, requestingUserId) {
    try {
      // REMOVE THIS CHECK - middleware already verified membership
      // const group = await Group.findById(groupId);
      // if (!group || !group.isMember(requestingUserId)) {
      //   throw new Error('Access denied - not a group member');
      // }

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

  async updateExpense(expenseId, updateData, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Get group ONLY for split recalculation, not permission checking
      const group = await Group.findById(expense.groupId).populate('members.userId');
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Store original amount for comparison
      const originalAmount = expense.amount;

      // Update expense
      Object.assign(expense, updateData);
      
      // Recalculate splits if amount changed
      if (updateData.amount && updateData.amount !== originalAmount) {
        console.log(`💰 Amount changed from ${originalAmount} to ${updateData.amount}, recalculating splits...`);
        
        // Preserve existing split ratios when recalculating
        if (expense.splitType === 'percentage') {
          // Recalculate based on existing percentages
          expense.splits.forEach(split => {
            split.amount = parseFloat(((expense.amount * split.percentage) / 100).toFixed(2));
          });
        } else {
          // Reset to equal splits for equal/custom types
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

      // REMOVE MEMBERSHIP CHECK - middleware already verified
      // if (!group.isMember(requestingUserId)) {
      //   throw new Error('Access denied - not a group member');
      // }

      const userRole = group.findMember(requestingUserId).role;

      // Check permissions (admin or payer can delete)
      if (userRole !== 'admin' && expense.payerId.toString() !== requestingUserId) {
        throw new Error('Insufficient permissions to delete this expense');
      }

      await Expense.findByIdAndDelete(expenseId);

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

      // Send payment notification to the original payer (if different from the one who paid)
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
          logger.warn('❌ Split payment notification failed:', notificationError);
        }
      }

      // If expense just became fully settled, notify all group members
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
        } catch (notificationError) {
          logger.warn('❌ Expense settlement notification failed:', notificationError);
        }
      }

      logger.info(`Split marked as paid for expense ${expenseId} by user ${requestingUserId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Mark split paid error:', error);
      throw error;
    }
  }

  // Add this new method for sending payment reminders:
  async sendPaymentReminders(groupId, requestingUserId, daysThreshold = 3) {
    try {

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

  async getGroupBalances(groupId, requestingUserId) {
    try {
      // Use the FIXED balance calculation
      const balances = await Expense.calculateGroupBalances(groupId);
      
      // Add status indicators based on CURRENT debt, not historical
      const balancesWithStatus = balances.map(balance => ({
        ...balance,
        status: balance.netBalance > 0 ? 'owed' : 
                balance.netBalance < 0 ? 'owes' : 'settled',
        formattedBalance: Math.abs(balance.netBalance).toFixed(2),
        formattedOwed: balance.totalOwed.toFixed(2),
        formattedPaid: balance.totalPaid.toFixed(2)
      }));

      // Calculate summary
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

  async getDetailedUserBalance(groupId, userId, requestingUserId) {
    try {
      // Verify group membership (middleware should handle this, but double-check)
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }
      
      // Users can only see their own detailed balance, unless they're admin
      const userRole = group.findMember(requestingUserId).role;
      if (userId !== requestingUserId && userRole !== 'admin') {
        throw new Error('Can only view your own detailed balance');
      }
      
      const balanceExplanation = await Expense.getDetailedBalanceExplanation(groupId, userId);
      
      return balanceExplanation;
    } catch (error) {
      logger.error('Get detailed user balance error:', error);
      throw error;
    }
  }

  async getEnhancedGroupBalances(groupId, requestingUserId) {
    try {
      // Get the corrected balances
      const balances = await Expense.calculateGroupBalances(groupId);
      
      // Add status indicators and formatting
      const enhancedBalances = balances.map(balance => ({
        ...balance,
        status: balance.netBalance > 0 ? 'owed' : 
                balance.netBalance < 0 ? 'owes' : 'settled',
        formattedNetBalance: Math.abs(balance.netBalance).toFixed(2),
        balanceDescription: balance.netBalance > 0 ? 
          `Others owe them $${Math.abs(balance.netBalance).toFixed(2)}` :
          balance.netBalance < 0 ?
          `They owe others $${Math.abs(balance.netBalance).toFixed(2)}` :
          'All settled up'
      }));
      
      // Calculate summary
      const totalGroupExpenses = balances.reduce((sum, balance) => sum + balance.totalPaid, 0);
      const totalOutstanding = balances.reduce((sum, balance) => sum + balance.totalOwed, 0);
      const averagePerMember = balances.length > 0 ? totalGroupExpenses / balances.length : 0;
      
      // Verify balance conservation (all net balances should sum to zero)
      const totalNetBalance = balances.reduce((sum, balance) => sum + balance.netBalance, 0);
      const balanceConservationCheck = Math.abs(totalNetBalance) < 0.01; // Account for rounding
      
      return {
        balances: enhancedBalances,
        summary: {
          totalGroupExpenses: totalGroupExpenses.toFixed(2),
          totalOutstanding: totalOutstanding.toFixed(2),
          averagePerMember: averagePerMember.toFixed(2),
          memberCount: balances.length,
          hasOutstandingBalances: enhancedBalances.some(b => b.status !== 'settled'),
          balanceConservationCheck, // Should always be true
          totalNetBalance: totalNetBalance.toFixed(2) // Should always be ~0.00
        }
      };
    } catch (error) {
      logger.error('Get enhanced group balances error:', error);
      throw error;
    }
  }

  async validateExpenseIntegrity(groupId, requestingUserId) {
    try {
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }
      
      const expenses = await Expense.find({ groupId });
      const issues = [];
      
      expenses.forEach(expense => {
        // Check if splits add up to expense amount
        const totalSplits = expense.splits.reduce((sum, split) => sum + split.amount, 0);
        const difference = Math.abs(totalSplits - expense.amount);
        
        if (difference > 0.01) {
          issues.push({
            expenseId: expense._id,
            description: expense.description,
            issue: 'Splits do not add up to expense amount',
            expenseAmount: expense.amount,
            totalSplits,
            difference
          });
        }
        
        // Check if payer has a split
        const payerSplit = expense.splits.find(split => 
          split.memberId.toString() === expense.payerId.toString()
        );
        
        if (!payerSplit) {
          issues.push({
            expenseId: expense._id,
            description: expense.description,
            issue: 'Payer does not have a split in this expense'
          });
        }
      });
      
      return {
        totalExpenses: expenses.length,
        issuesFound: issues.length,
        issues,
        isHealthy: issues.length === 0
      };
    } catch (error) {
      logger.error('Validate expense integrity error:', error);
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

      // Send notifications about split changes
      try {
        await notificationService.notifyExpenseSplitChanged({
          expense,
          updatedBy: requestingUserId,
          groupName: group.name
        });
      } catch (notificationError) {
        logger.warn('Split change notification failed:', notificationError);
      }

      logger.info(`Custom splits set for expense ${expenseId} by admin ${requestingUserId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Set custom splits error:', error);
      throw error;
  }
}

async resetToEqualSplits(expenseId, requestingUserId) {
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

    // Reset to equal splits
    expense.resetToEqualSplits(group.members);
    await expense.save();

    // Populate references
    await expense.populate([
      { path: 'payerId', select: 'name email profilePicture' },
      { path: 'splits.memberId', select: 'name email profilePicture' },
      { path: 'groupId', select: 'name' }
    ]);

    logger.info(`Splits reset to equal for expense ${expenseId} by admin ${requestingUserId}`);
    return expense.toJSON();
  } catch (error) {
    logger.error('Reset splits error:', error);
    throw error;
  }
}

  async getExpenseSummary(expenseId, requestingUserId) {
    try {
      const expense = await Expense.findById(expenseId)
        .populate('payerId', 'name email profilePicture')
        .populate('splits.memberId', 'name email profilePicture')
        .populate('groupId', 'name');

      if (!expense) {
        throw new Error('Expense not found');
      }

      return {
        expense: expense.toJSON(),
        summary: expense.getSummary()
      };
    } catch (error) {
      logger.error('Get expense summary error:', error);
      throw error;
    }
  }

  async createExpenseWithCustomSplits(expenseData, payerId, customSplits = null) {
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

      if (customSplits && customSplits.length > 0) {
        // Start with equal splits, then apply custom
        expense.calculateEqualSplits(group.members);
        expense.setCustomSplits(customSplits);
      } else {
        // Default equal splits
        expense.calculateEqualSplits(group.members);
      }

      await expense.save();

      // Populate references
      await expense.populate([
        { path: 'payerId', select: 'name email profilePicture' },
        { path: 'splits.memberId', select: 'name email profilePicture' },
        { path: 'groupId', select: 'name' }
      ]);

      // Send notifications
      try {
        
        await notificationService.notifyNewExpense({
          expense,
          groupName: group.name,
          payerName: expense.payerId.name
        });
      } catch (notificationError) {
        logger.warn('New expense notification failed:', notificationError);
      }

      // Update group statistics
      await this.updateGroupExpenseStatistics(expenseData.groupId);

      logger.info(`Expense created: ${expense.description} by user ${payerId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Create expense with custom splits error:', error);
      throw error;
    }
  }

  async getUnpaidExpenses(groupId, requestingUserId) {
    try {
      const filters = { isSettled: false };
      const result = await this.getExpenses(groupId, filters, requestingUserId);
      
      // Add urgency indicators
      const expensesWithUrgency = result.expenses.map(expense => {
        const daysSinceCreated = Math.floor((new Date() - new Date(expense.createdAt)) / (1000 * 60 * 60 * 24));
        
        return {
          ...expense,
          daysSinceCreated,
          urgency: daysSinceCreated > 7 ? 'high' : daysSinceCreated > 3 ? 'medium' : 'low'
        };
      });

      return {
        expenses: expensesWithUrgency,
        total: result.total,
        filters: result.filters,
        summary: {
          totalUnpaidAmount: expensesWithUrgency.reduce((sum, exp) => sum + exp.amount, 0),
          oldestExpense: expensesWithUrgency.length > 0 ? 
            Math.max(...expensesWithUrgency.map(exp => exp.daysSinceCreated)) : 0
        }
      };
    } catch (error) {
      logger.error('Get unpaid expenses error:', error);
      throw error;
    }
  }

  async getUserOwedAmount(groupId, userId) {
    try {
      const expenses = await Expense.find({ groupId, isSettled: false })
        .populate('splits.memberId', 'name');

      let totalOwed = 0;
      const expenseDetails = [];

      expenses.forEach(expense => {
        const userSplit = expense.splits.find(split => 
          split.memberId._id.toString() === userId && !split.paid
        );
        
        if (userSplit) {
          totalOwed += userSplit.amount;
          expenseDetails.push({
            expenseId: expense._id,
            description: expense.description,
            amount: userSplit.amount,
            daysOverdue: Math.floor((new Date() - expense.date) / (1000 * 60 * 60 * 24))
          });
        }
      });

      return {
        totalOwed,
        expenseCount: expenseDetails.length,
        expenses: expenseDetails
      };
    } catch (error) {
      logger.error('Get user owed amount error:', error);
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