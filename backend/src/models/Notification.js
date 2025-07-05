const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'TASK_ASSIGNED',
      'TASK_COMPLETED',
      'TASK_DUE_SOON',
      'TASK_OVERDUE',
      'AI_TASKS_READY',
      'EXPENSE_ADDED',
      'EXPENSE_SPLIT_PAID',
      'DIRECT_MESSAGE',
      'PAYMENT_REMINDER',
      'GROUP_MEMBER_JOINED',
      'GROUP_MEMBER_LEFT',
      'GROUP_ROLE_CHANGED'
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
// Snoozing functionality
  isSnoozed: {
    type: Boolean,
    default: false,
    index: true
  },
  snoozedUntil: {
    type: Date,
    default: null,
    index: true
  },
  snoozeCount: {
    type: Number,
    default: 0
  },

  // Batching functionality
  isBatched: {
    type: Boolean,
    default: false
  },
  batchCount: {
    type: Number,
    default: 1
  },
  batchedNotifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  batchParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  },

  // Enhanced delivery tracking
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  lastDeliveryAttempt: {
    type: Date
  },

  // User interaction tracking
  clickedAt: {
    type: Date
  },
  dismissedAt: {
    type: Date
  },

  // Enhanced data field with more structure
  data: {
    // Existing fields...
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actorName: String,
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense'
    },
    amount: Number,
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    actionUrl: String,
    
    // NEW FIELDS:
    broadcastType: String,
    isDirect: Boolean,
    taskCount: Number,
    originalText: String,
    taskIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
    
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  deliveryStatus: {
    websocket: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    push: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      messageId: String
    },
    email: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      messageId: String
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, groupId: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ groupId: 1, createdAt: -1 });
notificationSchema.index({ isSnoozed: 1, snoozedUntil: 1 });
notificationSchema.index({ recipientId: 1, isBatched: 1 });
notificationSchema.index({ recipientId: 1, clickedAt: 1 });


// Pre-save middleware to set readAt if isRead is true
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function(method, messageId = null) {
  if (this.deliveryStatus && this.deliveryStatus[method]) {
    this.deliveryStatus[method].delivered = true;
    this.deliveryStatus[method].deliveredAt = new Date();
    if (messageId) {
      this.deliveryStatus[method].messageId = messageId;
    }
  }
  return this.save();
};


notificationSchema.methods.markAsClicked = function() {
  this.clickedAt = new Date();
  return this.save();
};

// Mark notification as dismissed
notificationSchema.methods.markAsDismissed = function() {
  this.dismissedAt = new Date();
  return this.save();
};

// Check if notification should be shown (not snoozed)
notificationSchema.methods.shouldShow = function() {
  if (!this.isSnoozed) return true;
  return this.snoozedUntil && new Date() > this.snoozedUntil;
};

// Snooze notification
notificationSchema.methods.snooze = function(until) {
  this.isSnoozed = true;
  this.snoozedUntil = new Date(until);
  this.snoozeCount = (this.snoozeCount || 0) + 1;
  return this.save();
};

// Un-snooze notification
notificationSchema.methods.unsnooze = function() {
  this.isSnoozed = false;
  this.snoozedUntil = null;
  return this.save();
};


// Get active notifications (not snoozed or snooze time passed)
notificationSchema.statics.getActiveNotifications = function(userId, options = {}) {
  const now = new Date();
  const filter = {
    recipientId: userId,
    $or: [
      { isSnoozed: false },
      { isSnoozed: true, snoozedUntil: { $lte: now } }
    ]
  };
  
  if (options.unreadOnly) {
    filter.isRead = false;
  }
  
  return this.find(filter)
    .populate('data.actorId', 'name profilePicture')
    .populate('groupId', 'name')
    .sort({ createdAt: -1 });
};

// Get snoozed notifications
notificationSchema.statics.getSnoozedNotifications = function(userId) {
  const now = new Date();
  return this.find({
    recipientId: userId,
    isSnoozed: true,
    snoozedUntil: { $gt: now }
  }).sort({ snoozedUntil: 1 });
};

// Auto-unsnooze expired notifications
notificationSchema.statics.processExpiredSnoozes = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      isSnoozed: true,
      snoozedUntil: { $lte: now }
    },
    {
      isSnoozed: false,
      snoozedUntil: null
    }
  );
  
  return result.modifiedCount;
};

// Static methods
notificationSchema.statics.getUnreadCount = function(recipientId, groupId = null) {
  const filter = { recipientId, isRead: false };
  if (groupId) filter.groupId = groupId;
  return this.countDocuments(filter);
};

notificationSchema.statics.markAllAsRead = function(recipientId, groupId = null) {
  const filter = { recipientId, isRead: false };
  if (groupId) filter.groupId = groupId;
  return this.updateMany(filter, { 
    isRead: true, 
    readAt: new Date() 
  });
};

notificationSchema.statics.getRecentNotifications = function(recipientId, options = {}) {
  const {
    limit = 20,
    page = 1,
    unreadOnly = false,
    type = null,
    groupId = null
  } = options;

  const filter = { recipientId };
  if (unreadOnly) filter.isRead = false;
  if (type) filter.type = type;
  if (groupId) filter.groupId = groupId;

  return this.find(filter)
    .populate('data.actorId', 'name profilePicture')
    .populate('groupId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();
};

// Virtual for human-readable time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);