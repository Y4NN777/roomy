const jwt = require('jsonwebtoken');
const User = require('../models/User');
const responseHelper = require('../utils/responseHelper');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseHelper.unauthorized(res, 'Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return responseHelper.unauthorized(res, 'Access token is required');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Find user and check if still active
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return responseHelper.unauthorized(res, 'User account not found or inactive');
    }

    // Check token version for revoked tokens
    if (decoded.tokenVersion && decoded.tokenVersion !== user.tokenVersion) {
      return responseHelper.unauthorized(res, 'Token has been revoked');
    }

    // Attach user to request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      groupId: user.groupId ? user.groupId.toString() : null,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return responseHelper.unauthorized(res, 'Invalid token');
    }
    
    if (error.name === 'TokenExpiredError') {
      return responseHelper.unauthorized(res, 'Token expired');
    }
    
    return responseHelper.error(res, 'Authentication failed', 500);
  }
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  // If token is provided, validate it
  return authenticateToken(req, res, next);
};

module.exports = {
  authenticateToken,
  optionalAuth,
};