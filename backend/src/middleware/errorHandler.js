const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
    }));
    return responseHelper.validationError(res, details);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return responseHelper.error(
      res,
      `${field} already exists`,
      409,
      'DUPLICATE_ERROR'
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return responseHelper.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return responseHelper.unauthorized(res, 'Token expired');
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return responseHelper.error(
      res,
      'Invalid resource ID',
      400,
      'INVALID_ID'
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;

  return responseHelper.error(res, message, statusCode);
};

module.exports = errorHandler;