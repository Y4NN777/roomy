const mongoose = require('mongoose');
const CONSTANTS = require('../utils/constants');

const taskSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters'],
    default: '',
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  dueDate: {
    type: Date,
    default: null,
    index: true,
  },
  priority: {
    type: String,
    enum: Object.values(CONSTANTS.TASK_PRIORITY),
    default: CONSTANTS.TASK_PRIORITY.MEDIUM,
  },
  status: {
    type: String,
    enum: Object.values(CONSTANTS.TASK_STATUS),
    default: CONSTANTS.TASK_STATUS.PENDING,
    index: true,
  },
  category: {
    type: String,
    enum: Object.values(CONSTANTS.TASK_CATEGORY),
    default: CONSTANTS.TASK_CATEGORY.OTHER,
  },
  recurring: {
    type: {
      type: String,
      enum: Object.values(CONSTANTS.RECURRING_TYPE),
      default: CONSTANTS.RECURRING_TYPE.NONE,
    },
    interval: {
      type: Number,
      default: 1,
      min: 1,
    },
    endDate: {
      type: Date,
      default: null,
    },
    lastGenerated: {
      type: Date,
      default: null,
    },
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  originalVoiceInput: {
    type: String,
    default: null,
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null,
  },
  attachments: [{
    url: String,
    filename: String,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  completedAt: {
    type: Date,
    default: null,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: null,
  },
  actualDuration: {
    type: Number, // in minutes
    default: null,
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes for performance
taskSchema.index({ groupId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ groupId: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1, status: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && 
         this.status !== CONSTANTS.TASK_STATUS.COMPLETED && 
         new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const diff = this.dueDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
});

// Method to check if user can edit task
taskSchema.methods.canEdit = function(userId, userRole) {
  // Admin can edit any task
  if (userRole === CONSTANTS.USER_ROLES.ADMIN) return true;
  
  // Creator can edit their own task
  if (this.createdBy.toString() === userId) return true;
  
  // Assignee can edit their assigned task
  if (this.assignedTo && this.assignedTo.toString() === userId) return true;
  
  return false;
};

// Method to check if user can complete task
taskSchema.methods.canComplete = function(userId, userRole) {
  // Admin can complete any task
  if (userRole === CONSTANTS.USER_ROLES.ADMIN) return true;
  
  // Assignee can complete their task
  if (this.assignedTo && this.assignedTo.toString() === userId) return true;
  
  return false;
};

// Method to mark task as completed
taskSchema.methods.markCompleted = function(userId) {
  this.status = CONSTANTS.TASK_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.completedBy = userId;
  return this;
};

// Method to add note
taskSchema.methods.addNote = function(content, authorId) {
  this.notes.push({
    content,
    author: authorId,
    createdAt: new Date(),
  });
  return this;
};

// Static method to get user's tasks
taskSchema.statics.getUserTasks = function(userId, status = null) {
  const query = { assignedTo: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('groupId', 'name')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1, priority: -1 });
};

// Static method to get group's tasks
taskSchema.statics.getGroupTasks = function(groupId, filters = {}) {
  const query = { groupId };
  
  if (filters.status) query.status = filters.status;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  
  return this.find(query)
    .populate('assignedTo', 'name email profilePicture')
    .populate('createdBy', 'name email')
    .populate('completedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Pre-save middleware to handle recurring tasks
taskSchema.pre('save', function(next) {
  // Set virtual fields
  if (this.isModified('status') && this.status === CONSTANTS.TASK_STATUS.COMPLETED) {
    if (!this.completedAt) this.completedAt = new Date();
  }
  
  next();
});

// Transform output
taskSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Task', taskSchema);