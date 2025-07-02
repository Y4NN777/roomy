const express = require('express');
const expenseController = require('../../controllers/v1/expenseController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership } = require('../../middleware/groupPermissions');
const { verifyExpenseAccess, verifyExpenseAdminAccess } = require('../../middleware/expensePermissions');
const { validate, expenseSchemas } = require('../../middleware/validation');

const router = express.Router();

// Group expense routes (require group membership)
router.post('/', 
  authenticateToken, 
  validate(expenseSchemas.createExpense), 
  expenseController.createExpense
);

// Enhanced create with custom splits
router.post('/custom-splits', 
  authenticateToken, 
  validate(expenseSchemas.createExpenseWithCustomSplits), 
  expenseController.createExpenseWithCustomSplits
);

router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenses
);

router.get('/group/:groupId/unpaid', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getUnpaidExpenses
);

router.get('/group/:groupId/my-owed', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getMyOwedAmount
);

router.get('/group/:groupId/balances', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getGroupBalances
);

router.get('/group/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenseStatistics
);

// Individual expense routes
router.get('/:expenseId', 
  authenticateToken, 
  expenseController.getExpense
);

router.get('/:expenseId/summary', 
  authenticateToken, 
  expenseController.getExpenseSummary
);

router.patch('/:expenseId', 
  authenticateToken,
  verifyExpenseAccess,  // Use expense-based middleware
  validate(expenseSchemas.updateExpense), 
  expenseController.updateExpense
);

router.delete('/:expenseId', 
  authenticateToken, 
  verifyExpenseAccess,  // Use expense-based middleware
  expenseController.deleteExpense
);

// Split management routes (admin only) - FIXED MIDDLEWARE
router.patch('/:expenseId/splits/custom', 
  authenticateToken, 
  verifyExpenseAdminAccess,  // Use expense-based admin middleware
  validate(expenseSchemas.setCustomSplits), 
  expenseController.setCustomSplits
);

router.patch('/:expenseId/splits/reset', 
  authenticateToken, 
  verifyExpenseAdminAccess,  // Use expense-based admin middleware
  expenseController.resetToEqualSplits
);

// Split payment routes
router.patch('/:expenseId/splits/:memberId/pay', 
  authenticateToken, 
  verifyExpenseAccess,  // Use expense-based middleware
  expenseController.markSplitPaid
);

module.exports = router;