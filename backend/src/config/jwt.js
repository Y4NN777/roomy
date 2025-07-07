const jwt = require('jsonwebtoken');

// An object containing the configuration for JWT access and refresh tokens.
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '60m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

// Generates a new JWT access token.
const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expiresIn,
  });
};

// Generates a new JWT refresh token.
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.refreshToken.secret, {
    expiresIn: jwtConfig.refreshToken.expiresIn,
  });
};

// Verifies the signature and expiration of a JWT access token.
const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.accessToken.secret);
};

// Verifies the signature and expiration of a JWT refresh token.
const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshToken.secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  jwtConfig,
};