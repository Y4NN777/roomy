const express = require('express');
const expenseController = require('../../controllers/v1/expenseController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership } = require('../../middleware/groupPermissions');
const { validate, expenseSchemas } = require('../../middleware/validation');

const router = express.Router();

// Group expense routes (require group membership)
router.post('/', 
  authenticateToken, 
  verifyGroupMembership,
  validate(expenseSchemas.createExpense), 
  expenseController.createExpense
);

router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenses
);

router.get('/group/:groupId/balances', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getEnhancedGroupBalances
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

router.patch('/:expenseId', 
  authenticateToken, 
  validate(expenseSchemas.updateExpense), 
  expenseController.updateExpense
);

router.delete('/:expenseId', 
  authenticateToken, 
  expenseController.deleteExpense
);

// Split payment routes
router.patch('/:expenseId/splits/:memberId/pay', 
  authenticateToken,
  expenseController.markSplitPaid
);

router.get('/group/:groupId/balances/detailed/:userId?', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getDetailedUserBalance
);

// Integrity check route (useful for debugging)
router.get('/group/:groupId/integrity', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.validateExpenseIntegrity
);

module.exports = router;