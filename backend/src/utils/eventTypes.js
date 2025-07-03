// src/utils/eventTypes.js
const EventTypes = {
  // Task Events
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_DUE_SOON: 'task.due_soon',
  TASK_OVERDUE: 'task.overdue',
  TASK_UPDATED: 'task.updated',
  
  // AI-Generated Task Events
  AI_TASKS_SUGGESTED: 'ai.tasks_suggested',
  AI_TASKS_CONFIRMED: 'ai.tasks_confirmed',
  AI_PROCESSING_STARTED: 'ai.processing_started',
  AI_PROCESSING_COMPLETED: 'ai.processing_completed',
  
  // Expense Events
  EXPENSE_ADDED: 'expense.added',
  EXPENSE_SPLIT_PAID: 'expense.split_paid',
  EXPENSE_SETTLED: 'expense.settled',
  PAYMENT_REMINDER: 'payment.reminder',
  
  // Group Events
  GROUP_MEMBER_JOINED: 'group.member_joined',
  GROUP_MEMBER_LEFT: 'group.member_left',
  GROUP_ROLE_CHANGED: 'group.role_changed',
  
  // User Events
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_TYPING: 'user.typing',
};

const NotificationTypes = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_COMPLETED: 'TASK_COMPLETED', 
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  TASK_OVERDUE: 'TASK_OVERDUE',
  AI_TASKS_READY: 'AI_TASKS_READY',
  EXPENSE_ADDED: 'EXPENSE_ADDED',
  EXPENSE_SPLIT_PAID: 'EXPENSE_SPLIT_PAID',
  PAYMENT_REMINDER: 'PAYMENT_REMINDER',
  GROUP_MEMBER_JOINED: 'GROUP_MEMBER_JOINED',
  GROUP_ROLE_CHANGED: 'GROUP_ROLE_CHANGED'
};

const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

module.exports = {
  EventTypes,
  NotificationTypes,
  NotificationPriority
};