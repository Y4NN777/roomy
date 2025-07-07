
const EventTypes = {
  // Task Events
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  TASK_DUE_SOON: 'task.due_soon',
  TASK_OVERDUE: 'task.overdue',
  TASK_REASSIGNED: 'task.reassigned',

  // AI-Generated Task Events
  AI_TASKS_SUGGESTED: 'ai.tasks_suggested',
  AI_TASKS_CONFIRMED: 'ai.tasks_confirmed',
  AI_PROCESSING_STARTED: 'ai.processing_started',
  AI_PROCESSING_COMPLETED: 'ai.processing_completed',
  AI_PROCESSING_FAILED: 'ai.processing_failed',

  // Expense Events
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_ADDED: 'expense.added', // Alias for EXPENSE_CREATED
  EXPENSE_UPDATED: 'expense.updated',
  EXPENSE_DELETED: 'expense.deleted',
  EXPENSE_SPLIT_PAID: 'expense.split_paid',
  EXPENSE_FULLY_SETTLED: 'expense.fully_settled',
  EXPENSE_SETTLED: 'expense.settled', // Alias for EXPENSE_FULLY_SETTLED
  EXPENSE_SPLITS_CHANGED: 'expense.splits_changed',
  EXPENSE_SPLIT_RESET: 'expense.split_reset',
  CUSTOM_EXPENSE_SPLIT_SET: 'expense.custom_split_set',
  PAYMENT_REMINDER: 'payment.reminder',

  // Group Events
  GROUP_CREATED: 'group.created',
  GROUP_UPDATED: 'group.updated',
  GROUP_MEMBER_JOINED: 'group.member_joined',
  GROUP_MEMBER_LEFT: 'group.member_left',
  GROUP_MEMBER_REMOVED: 'group.member_removed',
  GROUP_ADMIN_TRANSFERRED: 'group.admin_transferred',
  GROUP_ROLE_CHANGED: 'group.role_changed',
  GROUP_INVITE_CODE_REGENERATED: 'group.invite_code_regenerated',
  GROUP_EMAIL_INVITATION_SENT: 'group.email_invitation_sent',

  // User Events
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_TYPING: 'user.typing',
  USER_JOINED: 'user.joined',
  USER_LEFT: 'user.left',

  // Notification Events (internal)
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_DELETED: 'notification.deleted',

  // System Events
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_ERROR: 'system.error'
};

const NotificationTypes = {
  // Task Notifications
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_COMPLETED: 'TASK_COMPLETED', 
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  TASK_OVERDUE: 'TASK_OVERDUE',
  TASK_REASSIGNED: 'TASK_REASSIGNED',

  // AI Notifications
  AI_TASKS_READY: 'AI_TASKS_READY',
  AI_PROCESSING_COMPLETE: 'AI_PROCESSING_COMPLETE',

  // Expense Notifications
  EXPENSE_ADDED: 'EXPENSE_ADDED',
  EXPENSE_SPLIT_PAID: 'EXPENSE_SPLIT_PAID',
  EXPENSE_SETTLED: 'EXPENSE_SETTLED',
  EXPENSE_REMINDER: 'EXPENSE_REMINDER',
  PAYMENT_REMINDER: 'PAYMENT_REMINDER',

  // Group Notifications
  GROUP_MEMBER_JOINED: 'GROUP_MEMBER_JOINED',
  GROUP_MEMBER_LEFT: 'GROUP_MEMBER_LEFT',
  GROUP_ROLE_CHANGED: 'GROUP_ROLE_CHANGED',
  GROUP_INVITE_RECEIVED: 'GROUP_INVITE_RECEIVED',
  GROUP_SETTINGS_UPDATED: 'GROUP_SETTINGS_UPDATED',

  // System Notifications
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
  DIRECT_MESSAGE: 'DIRECT_MESSAGE'
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