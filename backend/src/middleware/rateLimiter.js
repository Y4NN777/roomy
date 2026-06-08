const rateLimit = require('express-rate-limit');
const responseHelper = require('../utils/responseHelper');

/**
 * @description Custom handler for when the rate limit is exceeded.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {object} next - The Express next middleware function.
 * @param {object} options - The rate limit options.
 */
const rateLimitHandler = (req, res, next, options) => {
  responseHelper.error(
    res,
    'Too many requests, please try again later.',
    options.statusCode,
    'RATE_LIMIT_EXCEEDED'
  );
};

/**
 * @description Creates a rate limiter with default settings for general API usage.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitHandler,
});

/**
 * @description Creates a stricter rate limiter for sensitive actions like login and registration.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour for authentication routes
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = {
  generalLimiter,
  authLimiter,
};
