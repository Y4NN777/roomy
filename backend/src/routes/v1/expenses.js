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

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         amount:
 *           type: number
 *           format: float
 *         currency:
 *           type: string
 *           default: "USD"
 *         category:
 *           type: string
 *           enum: [food, utilities, rent, entertainment, transportation, other]
 *         paidBy:
 *           type: string
 *           description: User ID who paid
 *         groupId:
 *           type: string
 *         splits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ExpenseSplit'
 *         receiptUrl:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64abc123def456789"
 *         title: "Grocery Shopping"
 *         description: "Weekly groceries for the house"
 *         amount: 125.50
 *         currency: "USD"
 *         category: "food"
 *         paidBy: "64abc123def456789"
 *         groupId: "64def456abc123789"
 *     
 *     ExpenseSplit:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         amount:
 *           type: number
 *           format: float
 *         isPaid:
 *           type: boolean
 *           default: false
 *         paidAt:
 *           type: string
 *           format: date-time
 *       example:
 *         userId: "64abc123def456789"
 *         userName: "John Doe"
 *         amount: 41.83
 *         isPaid: false
 *     
 *     CreateExpenseRequest:
 *       type: object
 *       required:
 *         - title
 *         - amount
 *         - groupId
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description:
 *           type: string
 *           maxLength: 1000
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           default: "USD"
 *         category:
 *           type: string
 *           enum: [food, utilities, rent, entertainment, transportation, other]
 *         groupId:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *       example:
 *         title: "Grocery Shopping"
 *         description: "Weekly groceries"
 *         amount: 125.50
 *         category: "food"
 *         groupId: "64def456abc123789"
 *     
 *     CreateExpenseWithCustomSplitsRequest:
 *       type: object
 *       required:
 *         - title
 *         - amount
 *         - groupId
 *         - splits
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         amount:
 *           type: number
 *           format: float
 *         category:
 *           type: string
 *           enum: [food, utilities, rent, entertainment, transportation, other]
 *         groupId:
 *           type: string
 *         splits:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *         date:
 *           type: string
 *           format: date-time
 *     
 *     GroupBalances:
 *       type: object
 *       properties:
 *         balances:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               totalOwed:
 *                 type: number
 *               totalPaid:
 *                 type: number
 *               netBalance:
 *                 type: number
 *         totalGroupExpenses:
 *           type: number
 *         totalUnpaidAmount:
 *           type: number
 *     
 *     ExpenseStatistics:
 *       type: object
 *       properties:
 *         totalExpenses:
 *           type: number
 *         totalPaidExpenses:
 *           type: number
 *         totalUnpaidExpenses:
 *           type: number
 *         expensesByCategory:
 *           type: object
 *         expensesByMonth:
 *           type: object
 *         averageExpensePerMember:
 *           type: number
 * 
 * tags:
 *   - name: Expenses
 *     description: Expense tracking and splitting within groups
 */

/**
 * @swagger
 * /api/v1/expenses:
 *   post:
 *     summary: Create a new expense with equal splits
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExpenseRequest'
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Defines routes for creating and managing expenses within a group.
// Route to create a new expense with equal splits.
router.post('/', 
  authenticateToken, 
  validate(expenseSchemas.createExpense), 
  expenseController.createExpense
);

/**
 * @swagger
 * /api/v1/expenses/custom-splits:
 *   post:
 *     summary: Create a new expense with custom splits
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExpenseWithCustomSplitsRequest'
 *     responses:
 *       201:
 *         description: Expense with custom splits created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
// Route to create a new expense with custom splits.
router.post('/custom-splits', 
  authenticateToken, 
  validate(expenseSchemas.createExpenseWithCustomSplits), 
  expenseController.createExpenseWithCustomSplits
);

/**
 * @swagger
 * /api/v1/expenses/group/{groupId}:
 *   get:
 *     summary: Get all expenses for a group
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [food, utilities, rent, entertainment, transportation, other]
 *       - in: query
 *         name: paidBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalExpenses:
 *                       type: integer
 */
// Route to get all expenses for a specific group.
router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenses
);

/**
 * @swagger
 * /api/v1/expenses/group/{groupId}/unpaid:
 *   get:
 *     summary: Get all unpaid expenses for a group
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unpaid expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 */
// Route to get all unpaid expenses for a specific group.
router.get('/group/:groupId/unpaid', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getUnpaidExpenses
);

/**
 * @swagger
 * /api/v1/expenses/group/{groupId}/my-owed:
 *   get:
 *     summary: Get total amount owed by current user in a group
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Amount owed by user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOwed:
 *                   type: number
 *                 unpaidExpenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 */
// Route to get the total amount owed by the current user in a specific group.
router.get('/group/:groupId/my-owed', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getMyOwedAmount
);

/**
 * @swagger
 * /api/v1/expenses/group/{groupId}/balances:
 *   get:
 *     summary: Get financial balances for all group members
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group financial balances
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupBalances'
 */
// Route to get the financial balances for all members of a specific group.
router.get('/group/:groupId/balances', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getGroupBalances
);

/**
 * @swagger
 * /api/v1/expenses/group/{groupId}/statistics:
 *   get:
 *     summary: Get expense statistics for a group
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpenseStatistics'
 */
// Route to get expense statistics for a specific group.
router.get('/group/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  expenseController.getExpenseStatistics
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}:
 *   get:
 *     summary: Get a single expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
// Defines routes for managing individual expenses.
// Route to get a single expense by its ID.
router.get('/:expenseId', 
  authenticateToken, 
  expenseController.getExpense
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}/summary:
 *   get:
 *     summary: Get expense summary
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *                 totalPaid:
 *                   type: number
 *                 totalUnpaid:
 *                   type: number
 *                 paidPercentage:
 *                   type: number
 */
// Route to get a summary of a single expense.
router.get('/:expenseId/summary', 
  authenticateToken, 
  expenseController.getExpenseSummary
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}:
 *   patch:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [food, utilities, rent, entertainment, transportation, other]
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
// Route to update an existing expense.
router.patch('/:expenseId', 
  authenticateToken,
  verifyExpenseAccess,  // Ensures the user has access to the expense.
  validate(expenseSchemas.updateExpense), 
  expenseController.updateExpense
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Expense deleted successfully
 */
// Route to delete an existing expense.
router.delete('/:expenseId', 
  authenticateToken, 
  verifyExpenseAccess,  // Ensures the user has access to the expense.
  expenseController.deleteExpense
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}/splits/custom:
 *   patch:
 *     summary: Set custom splits for an expense (Admin only)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - splits
 *             properties:
 *               splits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       format: float
 *             example:
 *               splits:
 *                 - userId: "64abc123def456789"
 *                   amount: 50.00
 *                 - userId: "64def456abc123789"
 *                   amount: 75.50
 *     responses:
 *       200:
 *         description: Custom splits set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Defines routes for managing expense splits, restricted to expense administrators.
// Route to set custom splits for an expense.
router.patch('/:expenseId/splits/custom', 
  authenticateToken, 
  verifyExpenseAdminAccess,  // Ensures the user has admin access to the expense.
  validate(expenseSchemas.setCustomSplits), 
  expenseController.setCustomSplits
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}/splits/reset:
 *   patch:
 *     summary: Reset expense splits to equal amounts (Admin only)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Splits reset to equal amounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route to reset expense splits to be equal.
router.patch('/:expenseId/splits/reset', 
  authenticateToken, 
  verifyExpenseAdminAccess,  // Ensures the user has admin access to the expense.
  expenseController.resetToEqualSplits
);

/**
 * @swagger
 * /api/v1/expenses/{expenseId}/splits/{memberId}/pay:
 *   patch:
 *     summary: Mark an expense split as paid
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Split marked as paid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
// Defines routes for managing split payments.
// Route to mark a split as paid.
router.patch('/:expenseId/splits/:memberId/pay', 
  authenticateToken, 
  verifyExpenseSplitAccess, // Ensures the user has access to the expense split.
  expenseController.markSplitPaid
);

/**
 * @swagger
 * /api/v1/expenses/group/{groupId}/send-reminders:
 *   post:
 *     summary: Send payment reminders to group members
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reminders sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 remindersSent:
 *                   type: integer
 *               example:
 *                 message: "Payment reminders sent successfully"
 *                 remindersSent: 3
 */
// Route to send payment reminders to group members with outstanding balances.
router.post('/group/:groupId/send-reminders', 
  authenticateToken, 
  verifyGroupAdmin, 
  expenseController.sendPaymentReminders
);

module.exports = router;