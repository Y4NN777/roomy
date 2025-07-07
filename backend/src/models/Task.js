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
    type: Number, // The estimated duration of the task in minutes.
    default: null,
  },
  actualDuration: {
    type: Number, // The actual duration of the task in minutes.
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

// Defining indexes for improved query performance.
taskSchema.index({ groupId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ groupId: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1, status: 1 });

// A virtual property to determine if the task is overdue.
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && 
         this.status !== CONSTANTS.TASK_STATUS.COMPLETED && 
         new Date() > this.dueDate;
});

// A virtual property to calculate the number of days until the task is due.
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const diff = this.dueDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
});

// A method to check if a user has permission to edit the task.
taskSchema.methods.canEdit = function(userId, userRole) {
  // Admins have universal edit permissions.
  if (userRole === CONSTANTS.USER_ROLES.ADMIN) return true;
  
  // The user who created the task is allowed to edit it.
  if (this.createdBy.toString() === userId) return true;
  
  // The user assigned to the task is allowed to edit it.
  if (this.assignedTo && this.assignedTo.toString() === userId) return true;
  
  return false;
};

// A method to check if a user has permission to complete the task.
taskSchema.methods.canComplete = function(userId, userRole) {
  // Admins have universal completion permissions.
  if (userRole === CONSTANTS.USER_ROLES.ADMIN) return true;
  
  // The user assigned to the task is allowed to complete it.
  if (this.assignedTo && this.assignedTo.toString() === userId) return true;
  
  return false;
};

// A method to mark the task as completed.
taskSchema.methods.markCompleted = function(userId) {
  this.status = CONSTANTS.TASK_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.completedBy = userId;
  return this;
};

// A method to add a note to the task.
taskSchema.methods.addNote = function(content, authorId) {
  this.notes.push({
    content,
    author: authorId,
    createdAt: new Date(),
  });
  return this;
};

// A static method to retrieve all tasks assigned to a specific user.
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