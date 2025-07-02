const Expense = require('../models/Expense');
const Group = require('../models/Group');
const responseHelper = require('../utils/responseHelper');
const CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger');

// Verify user can manage expense (admin or payer)
const verifyExpenseAccess = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.id;

    if (!expenseId) {
      return responseHelper.error(res, 'Expense ID is required', 400, 'MISSING_EXPENSE_ID');
    }

    // Get expense with group info
    const expense = await Expense.findById(expenseId).populate('groupId');
    if (!expense) {
      return responseHelper.notFound(res, 'Expense not found');
    }

    // Get group with members
    const group = await Group.findById(expense.groupId._id);
    if (!group || !group.isActive) {
      return responseHelper.notFound(res, 'Group not found');
    }

    // Check if user is a group member
    const member = group.findMember(userId);
    if (!member) {
      return responseHelper.forbidden(res, 'Access denied - not a group member');
    }

    // Check if user can manage this expense (admin or payer)
    const canManage = member.role === CONSTANTS.USER_ROLES.ADMIN || 
                     expense.payerId.toString() === userId;

    if (!canManage) {
      return responseHelper.forbidden(res, 'Insufficient permissions to manage this expense');
    }

    // Attach expense and group to request
    req.expense = expense;
    req.group = group;
    req.userRole = member.role;

    next();
  } catch (error) {
    logger.error('Expense access verification error:', error);
    return responseHelper.error(res, 'Failed to verify expense access', 500);
  }
};

// Verify user is admin of the expense's group
const verifyExpenseAdminAccess = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.id;

    if (!expenseId) {
      return responseHelper.error(res, 'Expense ID is required', 400, 'MISSING_EXPENSE_ID');
    }

    // Get expense with group info
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return responseHelper.notFound(res, 'Expense not found');
    }

    // Get group with members
    const group = await Group.findById(expense.groupId);
    if (!group || !group.isActive) {
      return responseHelper.notFound(res, 'Group not found');
    }

    // Check if user is a group member and admin
    const member = group.findMember(userId);
    if (!member) {
      return responseHelper.forbidden(res, 'Access denied - not a group member');
    }

    if (member.role !== CONSTANTS.USER_ROLES.ADMIN) {
      return responseHelper.forbidden(res, 'Admin privileges required');
    }

    // Attach expense and group to request
    req.expense = expense;
    req.group = group;
    req.userRole = member.role;

    next();
  } catch (error) {
    logger.error('Expense admin verification error:', error);
    return responseHelper.error(res, 'Failed to verify admin privileges', 500);
  }
};

module.exports = {
  verifyExpenseAccess,
  verifyExpenseAdminAccess,
};