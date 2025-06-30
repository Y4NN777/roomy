const express = require('express');
const authRoutes = require('./auth');

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);

module.exports = router;