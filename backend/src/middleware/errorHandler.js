const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');

// A centralized error-handling middleware that logs errors and sends standardized responses.
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handles Mongoose validation errors, returning a structured response with detailed error fields.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
    }));
    return responseHelper.validationError(res, details);
  }

  // Handles Mongoose duplicate key errors, such as when a unique field already exists.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return responseHelper.error(
      res,
      `${field} already exists`,
      409,
      'DUPLICATE_ERROR'
    );
  }

  // Handles JWT-related errors, including invalid signatures and expired tokens.
  if (err.name === 'JsonWebTokenError') {
    return responseHelper.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return responseHelper.unauthorized(res, 'Token expired');
  }

  // Handles Mongoose CastErrors, which typically occur when an invalid ObjectId is provided.
  if (err.name === 'CastError') {
    return responseHelper.error(
      res,
      'Invalid resource ID',
      400,
      'INVALID_ID'
    );
  }

  // Provides a default fallback for any other unhandled errors, returning a generic message in production.
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;

  return responseHelper.error(res, message, statusCode);
};

module.exports = errorHandler;