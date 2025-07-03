const express = require('express');
const authRoutes = require('./auth');
const aiRoutes = require('./ai');
const groupRoutes = require('./groups');
const taskRoutes = require('./tasks');
const expenseRoutes = require('./expenses');
const debugController = require('../../controllers/v1/debugController');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/tasks', taskRoutes);
router.use('/expenses', expenseRoutes);
router.use('/ai', aiRoutes);

// Debug routes (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/expense/:expenseId', authenticateToken, debugController.analyzeExpense);
  router.get('/debug/balances/:groupId', authenticateToken, debugController.analyzeBalances);
}

module.exports = router;