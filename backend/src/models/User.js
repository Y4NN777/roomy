const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CONSTANTS = require('../utils/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters long'],
    select: false, // The user's password, which is not included in query results by default.
  },
  profilePicture: {
    type: String,
    default: null,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true,
    },
    voiceEnabled: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },

  notificationPreferences: {
    email: {
      taskAssigned: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      taskDueSoon: { type: Boolean, default: true },
      expenseAdded: { type: Boolean, default: true },
      expenseSplitPaid: { type: Boolean, default: true },
      groupMemberJoined: { type: Boolean, default: false },
      aiTasksReady: { type: Boolean, default: true }
    },
    push: {
      taskAssigned: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: false },
      taskDueSoon: { type: Boolean, default: true },
      expenseAdded: { type: Boolean, default: true },
      expenseSplitPaid: { type: Boolean, default: true },
      groupMemberJoined: { type: Boolean, default: false },
      aiTasksReady: { type: Boolean, default: true }
    },
    inApp: {
      taskAssigned: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      taskDueSoon: { type: Boolean, default: true },
      expenseAdded: { type: Boolean, default: true },
      expenseSplitPaid: { type: Boolean, default: true },
      groupMemberJoined: { type: Boolean, default: true },
      aiTasksReady: { type: Boolean, default: true }
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' }
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  tokenVersion: {
    type: Number,
    default: 1, // A version number for JWT refresh tokens to enable revocation.
  },
}, {
  timestamps: true,
});

// Defining indexes for improved query performance.
userSchema.index({ groupId: 1 });
userSchema.index({ isActive: 1 });

// A pre-save middleware to hash the user's password before saving it to the database.
userSchema.pre('save', async function(next) {
  // Ensuring the password is only hashed if it has been modified.
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// A method to compare a candidate password with the user's hashed password.
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// A method to update the user's last login timestamp.
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// A method to invalidate refresh tokens by incrementing the token version.
userSchema.methods.revokeTokens = function() {
  this.tokenVersion += 1;
  return this.save();
};

// A transformation method to remove sensitive fields from the user object when it is converted to JSON.
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.tokenVersion;
  delete userObject.__v;
  return userObject;
};

// A static method to find an active user by email and include the password for authentication purposes.
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email, isActive: true }).select('+password');
};

module.exports = mongoose.model('User', userSchema);