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

const groupSchemas = {
  createGroup: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Group name must be at least 2 characters long',
        'string.max': 'Group name cannot exceed 100 characters',
        'any.required': 'Group name is required',
      }),
    
    description: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 500 characters',
      }),
  }),

  joinGroup: Joi.object({
    inviteCode: Joi.string()
      .trim()
      .length(8)
      .uppercase()
      .required()
      .messages({
        'string.length': 'Invite code must be exactly 8 characters',
        'any.required': 'Invite code is required',
      }),
  }),

  // Add to groupSchemas:
  sendEmailInvitation: Joi.object({
    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        }),

    message: Joi.string()
        .trim()
        .max(500)
        .optional()
        .allow('')
        .messages({
        'string.max': 'Message cannot exceed 500 characters',
        }),
    } ),

  updateGroup: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional(),
    
    description: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow(''),
    
    settings: Joi.object({
      maxMembers: Joi.number()
        .integer()
        .min(2)
        .max(20)
        .optional(),
      allowExpenses: Joi.boolean().optional(),
      timezone: Joi.string().optional(),
      autoAssignTasks: Joi.boolean().optional(),
    }).optional(),
  }),

  transferAdmin: Joi.object({
    newAdminId: Joi.string()
      .required()
      .messages({
        'any.required': 'New admin ID is required',
      }),
  }),

  updateMemberRole: Joi.object({
    role: Joi.string()
      .valid('admin', 'member')
      .required()
      .messages({
        'any.only': 'Role must be either admin or member',
        'any.required': 'Role is required',
      }),
  })
};

const taskSchemas = {
  createTask: Joi.object({
    groupId: Joi.string()
      .required()
      .messages({
        'any.required': 'Group ID is required',
      }),
    
    title: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.min': 'Title is required',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required',
      }),
    
    description: Joi.string()
      .trim()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    
    assignedTo: Joi.string()
      .optional()
      .allow(null),
    
    dueDate: Joi.date()
      .optional()
      .allow(null)
      .min('now')
      .messages({
        'date.min': 'Due date cannot be in the past',
      }),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional()
      .messages({
        'any.only': 'Priority must be low, medium, or high',
      }),
    
    category: Joi.string()
      .valid('cleaning', 'cooking', 'shopping', 'maintenance', 'bills', 'other')
      .optional()
      .messages({
        'any.only': 'Invalid category',
      }),
    
    estimatedDuration: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.min': 'Estimated duration must be at least 1 minute',
      }),
  }),

  updateTask: Joi.object({
    title: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
    
    description: Joi.string()
      .trim()
      .max(1000)
      .optional()
      .allow(''),
    
    assignedTo: Joi.string()
      .optional()
      .allow(null),
    
    dueDate: Joi.date()
      .optional()
      .allow(null),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional(),
    
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed', 'cancelled')
      .optional(),
    
    category: Joi.string()
      .valid('cleaning', 'cooking', 'shopping', 'maintenance', 'bills', 'other')
      .optional(),
    
    estimatedDuration: Joi.number()
      .integer()
      .min(1)
      .optional(),
  }),

  completeTask: Joi.object({
    actualDuration: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.min': 'Actual duration must be at least 1 minute',
      }),
  }),

  addNote: Joi.object({
    content: Joi.string()
      .trim()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.min': 'Note content is required',
        'string.max': 'Note cannot exceed 500 characters',
        'any.required': 'Note content is required',
      }),
  }),
};

const expenseSchemas = {
  createExpense: Joi.object({
    groupId: Joi.string()
      .required()
      .messages({
        'any.required': 'Group ID is required',
      }),
    
    amount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Amount must be greater than 0',
        'any.required': 'Amount is required',
      }),
    
    description: Joi.string()
      .trim()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.min': 'Description is required',
        'string.max': 'Description cannot exceed 500 characters',
        'any.required': 'Description is required',
      }),
    
    category: Joi.string()
      .valid('groceries', 'utilities', 'rent', 'maintenance', 'entertainment', 'other')
      .optional()
      .messages({
        'any.only': 'Invalid category',
      }),
    
    date: Joi.date()
      .optional()
      .max('now')
      .messages({
        'date.max': 'Expense date cannot be in the future',
      }),
    
    notes: Joi.string()
      .trim()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Notes cannot exceed 1000 characters',
      }),
  }),

  updateExpense: Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    
    description: Joi.string()
      .trim()
      .min(1)
      .max(500)
      .optional(),
    
    category: Joi.string()
      .valid('groceries', 'utilities', 'rent', 'maintenance', 'entertainment', 'other')
      .optional(),
    
    date: Joi.date()
      .optional()
      .max('now'),
    
    notes: Joi.string()
      .trim()
      .max(1000)
      .optional()
      .allow(''),
  }),

  createExpenseWithCustomSplits: Joi.object({
    groupId: Joi.string().required(),
    amount: Joi.number().positive().precision(2).required(),
    description: Joi.string().trim().min(1).max(500).required(),
    category: Joi.string().valid('groceries', 'utilities', 'rent', 'maintenance', 'entertainment', 'other').optional(),
    date: Joi.date().optional().max('now'),
    notes: Joi.string().trim().max(1000).optional().allow(''),
    
    customSplits: Joi.array().items(
      Joi.object({
        memberId: Joi.string().required(),
        amount: Joi.number().positive().precision(2).optional(),
        percentage: Joi.number().min(0).max(100).precision(2).optional()
      }).xor('amount', 'percentage') // Either amount OR percentage, not both
    ).optional()
  }),

  setCustomSplits: Joi.object({
    splits: Joi.array().items(
      Joi.object({
        memberId: Joi.string().required(),
        amount: Joi.number().positive().precision(2).optional(),
        percentage: Joi.number().min(0).max(100).precision(2).optional()
      }).xor('amount', 'percentage')
    ).required().min(1)
  }),  
};

module.exports = {
  validate,
  authSchemas,
  groupSchemas,
  taskSchemas,
  expenseSchemas,
};
