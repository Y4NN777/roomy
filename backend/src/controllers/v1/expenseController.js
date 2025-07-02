const expenseService = require('../../services/expenseService');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../utils/logger');

class ExpenseController {
  async createExpense(req, res, next) {
    try {
      const expense = await expenseService.createExpense(req.body, req.user.id);
      
      responseHelper.success(
        res,
        'Expense created successfully',
        { expense },
        201
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const filters = {
        payerId: req.query.payerId,
        category: req.query.category,
        isSettled: req.query.isSettled === 'true' ? true : 
                   req.query.isSettled === 'false' ? false : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await expenseService.getExpenses(req.group._id, filters, req.user.id);
      
      responseHelper.success(
        res,
        'Expenses retrieved successfully',
        result
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async getExpense(req, res, next) {
    try {
      const { expenseId } = req.params;
      const expense = await expenseService.getExpense(expenseId, req.user.id);
      
      responseHelper.success(
        res,
        'Expense retrieved successfully',
        { expense }
      );
    } catch (error) {
      if (error.message === 'Expense not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const { expenseId } = req.params;
      const expense = await expenseService.updateExpense(expenseId, req.body, req.user.id);
      
      responseHelper.success(
        res,
        'Expense updated successfully',
        { expense }
      );
    } catch (error) {
      if (error.message === 'Expense not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissions')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const { expenseId } = req.params;
      const result = await expenseService.deleteExpense(expenseId, req.user.id);
      
      responseHelper.success(
        res,
        result.message
      );
    } catch (error) {
      if (error.message === 'Expense not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissions')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async markSplitPaid(req, res, next) {
    try {
      const { expenseId, memberId } = req.params;
      const expense = await expenseService.markSplitPaid(expenseId, memberId, req.user.id);
      
      responseHelper.success(
        res,
        'Split marked as paid successfully',
        { expense }
      );
    } catch (error) {
      if (error.message === 'Expense not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissions')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async getGroupBalances(req, res, next) {
    try {
      const result = await expenseService.getGroupBalances(req.group._id, req.user.id);
      
      responseHelper.success(
        res,
        'Group balances retrieved successfully',
        result
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async getEnhancedGroupBalances(req, res, next) {
    try {
        const result = await expenseService.getEnhancedGroupBalances(req.group._id, req.user.id);
        
        responseHelper.success(
        res,
        'Enhanced group balances retrieved successfully',
        result
        );
    } catch (error) {
        next(error);
    }
  }

  async getDetailedUserBalance(req, res, next) {
    try {
        const { userId } = req.params;
        const result = await expenseService.getDetailedUserBalance(
        req.group._id, 
        userId || req.user.id, 
        req.user.id
        );
        
        responseHelper.success(
        res,
        'Detailed user balance retrieved successfully',
        result
        );
    } catch (error) {
        if (error.message.includes('Can only view your own')) {
        return responseHelper.forbidden(res, error.message);
        }
        next(error);
    }
  }

  async validateExpenseIntegrity(req, res, next) {
    try {
        const result = await expenseService.validateExpenseIntegrity(req.group._id, req.user.id);
        
        responseHelper.success(
        res,
        'Expense integrity check completed',
        result
        );
    } catch (error) {
        next(error);
    }
  }

  async getExpenseStatistics(req, res, next) {
    try {
      const { period } = req.query;
      const result = await expenseService.getExpenseStatistics(
        req.group._id, 
        req.user.id, 
        period
      );
      
      responseHelper.success(
        res,
        'Expense statistics retrieved successfully',
        result
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }
}

module.exports = new ExpenseController();