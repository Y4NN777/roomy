const CONSTANTS = {
  USER_ROLES: {
    ADMIN: 'admin',
    MEMBER: 'member',
  },
  
  TASK_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  
  TASK_CATEGORY: {
    CLEANING: 'cleaning',
    COOKING: 'cooking',
    SHOPPING: 'shopping',
    MAINTENANCE: 'maintenance',
    BILLS: 'bills',
    OTHER: 'other',
  },
  
  EXPENSE_CATEGORY: {
    GROCERIES: 'groceries',
    UTILITIES: 'utilities',
    RENT: 'rent',
    MAINTENANCE: 'maintenance',
    ENTERTAINMENT: 'entertainment',
    OTHER: 'other',
  },
  
  RECURRING_TYPE: {
    NONE: 'none',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  },
  
  EXPENSE_SPLIT_TYPE: {
    EQUAL: 'equal',
    PERCENTAGE: 'percentage',
    CUSTOM: 'custom',
  },
  
  MAX_GROUP_MEMBERS: 20,
  MAX_INVITE_CODE_ATTEMPTS: 5,
  INVITE_CODE_LENGTH: 8,
  
  // Rate limiting
  RATE_LIMIT: {
    GENERAL: 100, // requests per 15 minutes
    AUTH: 5,      // login attempts per 15 minutes
    AI: 10,       // AI requests per minute
  },
};

module.exports = CONSTANTS;