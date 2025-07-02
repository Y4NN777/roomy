const Expense = require('../models/Expense');
const Group = require('../models/Group');
const logger = require('../utils/logger');

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

      // REMOVE THIS CHECK - middleware already verified membership
      // const group = await Group.findById(expense.groupId);
      // if (!group || !group.isMember(requestingUserId)) {
      //   throw new Error('Access denied - not a group member');
      // }

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

      // Get group for permission checking and split recalculation
      const group = await Group.findById(expense.groupId).populate('members.userId');
      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // REMOVE MEMBERSHIP CHECK - middleware already verified
      // if (!group.isMember(requestingUserId)) {
      //   throw new Error('Access denied - not a group member');
      // }

      const userRole = group.findMember(requestingUserId).role;

      // Check permissions (admin or payer can edit)
      if (userRole !== 'admin' && expense.payerId.toString() !== requestingUserId) {
        throw new Error('Insufficient permissions to edit this expense');
      }

      // Update expense
      Object.assign(expense, updateData);
      
      // Recalculate splits if amount changed
      if (updateData.amount && updateData.amount !== expense.amount) {
        expense.calculateEqualSplits(group.members);
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

      // REMOVE MEMBERSHIP CHECK - middleware already verified
      // if (!group.isMember(requestingUserId)) {
      //   throw new Error('Access denied - not a group member');
      // }

      const userRole = group.findMember(requestingUserId).role;

      // Check permissions (admin, payer, or the member themselves)
      if (userRole !== 'admin' && 
          expense.payerId.toString() !== requestingUserId &&
          memberId !== requestingUserId) {
        throw new Error('Insufficient permissions to mark split as paid');
      }

      // Mark split as paid
      expense.markSplitPaid(memberId, requestingUserId);
      await expense.save();

      // Populate references
      await expense.populate([
        { path: 'payerId', select: 'name email profilePicture' },
        { path: 'splits.memberId', select: 'name email profilePicture' }
      ]);

      logger.info(`Split marked as paid for expense ${expenseId} by user ${requestingUserId}`);
      return expense.toJSON();
    } catch (error) {
      logger.error('Mark split paid error:', error);
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
      // REMOVE MEMBERSHIP CHECK - middleware already verified
      // const group = await Group.findById(groupId);
      // if (!group || !group.isMember(requestingUserId)) {
      //   throw new Error('Access denied - not a group member');
      // }

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