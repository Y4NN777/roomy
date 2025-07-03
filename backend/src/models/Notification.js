// src/models/Notification.js
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
  data: {
    // Flexible data field for event-specific information
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