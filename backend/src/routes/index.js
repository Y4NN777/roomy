const express = require('express');
const v1Routes = require('./v1');

const router = express.Router();

// API version 1
router.use('/v1', v1Routes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Roomy API',
    version: process.env.API_VERSION || '1.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;