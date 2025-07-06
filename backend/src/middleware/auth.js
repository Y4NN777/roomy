const jwt = require('jsonwebtoken');
const User = require('../models/User');
const responseHelper = require('../utils/responseHelper');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

// Middleware to authenticate a user with a JWT, ensuring the token is valid and the user is active.
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseHelper.unauthorized(res, 'Access token is required');
    }

    const token = authHeader.substring(7); // Extracts the token from the 'Bearer ' prefix.

    if (!token) {
      return responseHelper.unauthorized(res, 'Access token is required');
    }

    // Verifies the token's signature and expiration.
    const decoded = verifyAccessToken(token);
    
    // Finds the user in the database and checks if their account is active.
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return responseHelper.unauthorized(res, 'User account not found or inactive');
    }

    // Checks the token version to ensure it has not been revoked.
    if (decoded.tokenVersion && decoded.tokenVersion !== user.tokenVersion) {
      return responseHelper.unauthorized(res, 'Token has been revoked');
    }

    // Attaches the authenticated user's information to the request object for use in subsequent middleware or controllers.
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

// Middleware for optional authentication, allowing access to endpoints that behave differently for authenticated and unauthenticated users.
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // If no token is provided, continues the request flow without an authenticated user.
  }

  // If a token is present, proceeds with standard authentication.
  return authenticateToken(req, res, next);
};

module.exports = {
  authenticateToken,
  optionalAuth,
};