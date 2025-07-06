const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const webSocketService = require('./services/notifications/WebSocketService');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
// Initializing the WebSocket service and attaching it to the HTTP server.
// This setup enables WebSocket connections to use the same server instance.
const io = webSocketService.initialize(server);


// Configuring the 'trust proxy' setting to ensure accurate IP address identification behind a proxy.
app.set('trust proxy', 1);

// Applying essential security middleware to protect the application from common vulnerabilities.
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// Configuring Cross-Origin Resource Sharing (CORS) to allow requests from authorized origins.
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Setting up request logging for monitoring and debugging purposes.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serving static assets, such as uploaded files, from the 'uploads' directory.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Adding middleware to parse incoming JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Defining a health check endpoint to monitor the application's status and availability.
app.get('/health', (req, res) => {

  const wsStats = webSocketService.getConnectionStats();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mounting the main application routes under the '/api' prefix.
app.use('/api', routes);

// Implementing a catch-all route to handle requests for non-existent endpoints, returning a 404 error.
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Implementing the global error handler as the final middleware to catch and process all application errors.
app.use(errorHandler);

module.exports = {app, io};