const Expense = require('../models/Expense');
const Group = require('../models/Group');
const responseHelper = require('../utils/responseHelper');
const CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger');

// Middleware to verify that the user has permission to manage an expense, either as a group admin or the original payer.
const verifyExpenseAccess = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.id;

    if (!expenseId) {
      return responseHelper.error(res, 'Expense ID is required', 400, 'MISSING_EXPENSE_ID');
    }

    // Retrieves the expense and populates its associated group information.
    const expense = await Expense.findById(expenseId).populate('groupId');
    if (!expense) {
      return responseHelper.notFound(res, 'Expense not found');
    }

    // Retrieves the group to verify its status and the user's membership.
    const group = await Group.findById(expense.groupId._id);
    if (!group || !group.isActive) {
      return responseHelper.notFound(res, 'Group not found');
    }

    // Verifies that the authenticated user is a member of the group.
    const member = group.findMember(userId);
    if (!member) {
      return responseHelper.forbidden(res, 'Access denied - not a group member');
    }

    // Checks if the user has the necessary permissions (admin or payer) to manage the expense.
    const canManage = member.role === CONSTANTS.USER_ROLES.ADMIN || 
                     expense.payerId.toString() === userId;

    if (!canManage) {
      return responseHelper.forbidden(res, 'Insufficient permissions to manage this expense');
    }

    // Attaches the expense, group, and user's role to the request object for use in subsequent middleware or controllers.
    req.expense = expense;
    req.group = group;
    req.userRole = member.role;

    next();
  } catch (error) {
    logger.error('Expense access verification error:', error);
    return responseHelper.error(res, 'Failed to verify expense access', 500);
  }
};

// Middleware to verify that the user is an admin of the group associated with the expense.
const verifyExpenseAdminAccess = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.id;

    if (!expenseId) {
      return responseHelper.error(res, 'Expense ID is required', 400, 'MISSING_EXPENSE_ID');
    }

    // Retrieves the expense to identify its associated group.
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return responseHelper.notFound(res, 'Expense not found');
    }

    // Retrieves the group to verify its status and the user's membership.
    const group = await Group.findById(expense.groupId);
    if (!group || !group.isActive) {
      return responseHelper.notFound(res, 'Group not found');
    }

    // Verifies that the user is a member of the group and has an admin role.
    const member = group.findMember(userId);
    if (!member) {
      return responseHelper.forbidden(res, 'Access denied - not a group member');
    }

    if (member.role !== CONSTANTS.USER_ROLES.ADMIN) {
      return responseHelper.forbidden(res, 'Admin privileges required');
    }

    // Attaches the expense, group, and user's role to the request object for use in subsequent middleware or controllers.
    req.expense = expense;
    req.group = group;
    req.userRole = member.role;

    next();
  } catch (error) {
    logger.error('Expense admin verification error:', error);
    return responseHelper.error(res, 'Failed to verify admin privileges', 500);
  }

};


// Middleware to verify that the user has permission to mark an expense split as paid.
const verifyExpenseSplitAccess = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const memberId = req.params.memberId; // The ID of the member whose split is being modified.
    const userId = req.user.id;

    if (!expenseId) {
      return responseHelper.error(res, 'Expense ID is required', 400, 'MISSING_EXPENSE_ID');
    }

    // Retrieves the expense and populates its associated group information.
    const expense = await Expense.findById(expenseId).populate('groupId');
    if (!expense) {
      return responseHelper.notFound(res, 'Expense not found');
    }

    // Retrieves the group to verify its status and the user's membership.
    const group = await Group.findById(expense.groupId._id);
    if (!group || !group.isActive) {
      return responseHelper.notFound(res, 'Group not found');
    }

    // Verifies that the authenticated user is a member of the group.
    const member = group.findMember(userId);
    if (!member) {
      return responseHelper.forbidden(res, 'Access denied - not a group member');
    }

    // Defines the permissions for marking a split as paid:
    // 1. Admins can mark any member's split as paid.
    // 2. The expense payer can mark any member's split as paid.
    // 3. Any member can mark their own split as paid.
    const isAdmin = member.role === CONSTANTS.USER_ROLES.ADMIN;
    const isPayer = expense.payerId.toString() === userId;
    const isMarkingOwnSplit = memberId === userId;

    const canMarkSplitPaid = isAdmin || isPayer || isMarkingOwnSplit;

    if (!canMarkSplitPaid) {
      return responseHelper.forbidden(res, 'You can only mark your own split as paid');
    }

    // Attaches the expense, group, and user's role to the request object for use in subsequent middleware or controllers.
    req.expense = expense;
    req.group = group;
    req.userRole = member.role;

    next();
  } catch (error) {
    logger.error('Expense or split access verification error:', error);
    return responseHelper.error(res, 'Failed to verify expense access', 500);
  }
};

module.exports = {
  verifyExpenseAccess,
  verifyExpenseSplitAccess,
  verifyExpenseAdminAccess,
};