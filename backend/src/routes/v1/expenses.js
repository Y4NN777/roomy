const express = require('express');
const expenseController = require('../../controllers/v1/expenseController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership } = require('../../middleware/groupPermissions');
const { 
  verifyExpenseAccess, // Ensures the user has access to the expense.
  verifyExpenseAdminAccess, // Ensures the user has admin access to the expense.
  verifyExpenseSplitAccess // Ensures the user has access to the expense split.
} = require('../../middleware/expensePermissions');
const { verifyGroupAdmin } = require('../../middleware/groupPermissions');
const { validate, expenseSchemas } = require('../../middleware/validation');

const router = express.Router();

// Defines routes for creating and managing expenses within a group.
// Route to create a new expense with equal splits.
router.post('/', 
  authenticateToken, 
  validate(expenseSchemas.createExpense), 
  expenseController.createExpense
);

// Route to create a new expense with custom splits.
router.post('/custom-splits', 
  authenticateToken, 
  validate(expenseSchemas.createExpenseWithCustomSplits), 
  expenseController.createExpenseWithCustomSplits
);

// Route to get all expenses for a specific group.
router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenses
);

// Route to get all unpaid expenses for a specific group.
router.get('/group/:groupId/unpaid', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getUnpaidExpenses
);

// Route to get the total amount owed by the current user in a specific group.
router.get('/group/:groupId/my-owed', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getMyOwedAmount
);

// Route to get the financial balances for all members of a specific group.
router.get('/group/:groupId/balances', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getGroupBalances
);

// Route to get expense statistics for a specific group.
router.get('/group/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenseStatistics
);

// Defines routes for managing individual expenses.
// Route to get a single expense by its ID.
router.get('/:expenseId', 
  authenticateToken, 
  expenseController.getExpense
);

// Route to get a summary of a single expense.
router.get('/:expenseId/summary', 
  authenticateToken, 
  expenseController.getExpenseSummary
);

// Route to update an existing expense.
router.patch('/:expenseId', 
  authenticateToken,
  verifyExpenseAccess,  // Ensures the user has access to the expense.
  validate(expenseSchemas.updateExpense), 
  expenseController.updateExpense
);

// Route to delete an existing expense.
router.delete('/:expenseId', 
  authenticateToken, 
  verifyExpenseAccess,  // Ensures the user has access to the expense.
  expenseController.deleteExpense
);

// Defines routes for managing expense splits, restricted to expense administrators.
// Route to set custom splits for an expense.
router.patch('/:expenseId/splits/custom', 
  authenticateToken, 
  verifyExpenseAdminAccess,  // Ensures the user has admin access to the expense.
  validate(expenseSchemas.setCustomSplits), 
  expenseController.setCustomSplits
);

// Route to reset expense splits to be equal.
router.patch('/:expenseId/splits/reset', 
  authenticateToken, 
  verifyExpenseAdminAccess,  // Ensures the user has admin access to the expense.
  expenseController.resetToEqualSplits
);

// Defines routes for managing split payments.
// Route to mark a split as paid.
router.patch('/:expenseId/splits/:memberId/pay', 
  authenticateToken, 
  verifyExpenseSplitAccess, // Ensures the user has access to the expense split.
  expenseController.markSplitPaid
);

// Route to send payment reminders to group members with outstanding balances.
router.post('/group/:groupId/send-reminders', 
  authenticateToken, 
  verifyGroupAdmin, 
  expenseController.sendPaymentReminders
);

module.exports = router;