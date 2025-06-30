const Joi = require('joi');
const responseHelper = require('../utils/responseHelper');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return responseHelper.validationError(res, details);
    }
    
    next();
  };
};

// Validation schemas
const authSchemas = {
  register: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required',
      }),
    
    email: Joi.string()
      .email()
      .trim()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
        'any.required': 'Password is required',
      }),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .trim()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional(),
    
    preferences: Joi.object({
      notifications: Joi.boolean().optional(),
      voiceEnabled: Joi.boolean().optional(),
      theme: Joi.string().valid('light', 'dark', 'system').optional(),
    }).optional(),
  }),
};

module.exports = {
  validate,
  authSchemas,
};