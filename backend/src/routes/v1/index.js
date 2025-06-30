const express = require('express');
const authRoutes = require('./auth');
const groupRoutes = require('./groups');

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);

module.exports = router;