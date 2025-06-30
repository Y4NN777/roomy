const responseHelper = {
  success: (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0',
    });
  },

  error: (res, message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) => {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    });
  },

  validationError: (res, details) => {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details,
      },
      timestamp: new Date().toISOString(),
    });
  },

  unauthorized: (res, message = 'Unauthorized access') => {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  },

  forbidden: (res, message = 'Access forbidden') => {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  },

  notFound: (res, message = 'Resource not found') => {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

module.exports = responseHelper;