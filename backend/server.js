const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🏠 Welcome to Roomy API',
    version: process.env.API_VERSION || '1.0',
    status: 'running'
  });
});

// API Routes
app.use('/api/v1/auth', require('./src/routes/v1/auth'));
app.use('/api/v1/groups', require('./src/routes/v1/groups'));
app.use('/api/v1/tasks', require('./src/routes/v1/tasks'));
app.use('/api/v1/expenses', require('./src/routes/v1/expenses'));
app.use('/api/v1/ai', require('./src/routes/v1/ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomy_development';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('📊 Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Roomy API server running on port ${PORT}`);
      console.log(`�� Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
