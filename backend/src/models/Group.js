const mongoose = require('mongoose');
const CONSTANTS = require('../utils/constants');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxLength: [100, 'Group name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters'],
    default: '',
    trim: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    length: CONSTANTS.INVITE_CODE_LENGTH,
    uppercase: true,
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: [CONSTANTS.USER_ROLES.ADMIN, CONSTANTS.USER_ROLES.MEMBER],
      default: CONSTANTS.USER_ROLES.MEMBER,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  settings: {
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: CONSTANTS.MAX_GROUP_MEMBERS,
    },
    allowExpenses: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    autoAssignTasks: {
      type: Boolean,
      default: true,
    },
  },
  statistics: {
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
groupSchema.index({unique: true });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ isActive: 1 });

// Generate unique invite code
groupSchema.statics.generateInviteCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = CONSTANTS.MAX_INVITE_CODE_ATTEMPTS;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < CONSTANTS.INVITE_CODE_LENGTH; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existingGroup = await this.findOne({ inviteCode: code });
    if (!existingGroup) {
      return code;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique invite code');
};

// Find member by user ID
groupSchema.methods.findMember = function(userId) {
  return this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
};

// Check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  const member = this.findMember(userId);
  return member && member.role === CONSTANTS.USER_ROLES.ADMIN;
};

// Check if user is member (admin or regular member)
groupSchema.methods.isMember = function(userId) {
  return !!this.findMember(userId);
};

// Add member to group
groupSchema.methods.addMember = function(userId, role = CONSTANTS.USER_ROLES.MEMBER) {
  // Check if user is already a member
  if (this.isMember(userId)) {
    throw new Error('User is already a member of this group');
  }

  // Check group capacity
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Group has reached maximum capacity');
  }

  this.members.push({
    userId,
    role,
    joinedAt: new Date(),
  });

  return this;
};

// Remove member from group
groupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }

  const member = this.members[memberIndex];
  
  // Prevent removing the last admin
  const adminCount = this.members.filter(m => m.role === CONSTANTS.USER_ROLES.ADMIN).length;
  if (member.role === CONSTANTS.USER_ROLES.ADMIN && adminCount === 1) {
    throw new Error('Cannot remove the last admin. Transfer admin role first.');
  }

  this.members.splice(memberIndex, 1);
  return this;
};

// Transfer admin role
groupSchema.methods.transferAdmin = function(currentAdminId, newAdminId) {
  const currentAdmin = this.findMember(currentAdminId);
  const newAdmin = this.findMember(newAdminId);

  if (!currentAdmin || currentAdmin.role !== CONSTANTS.USER_ROLES.ADMIN) {
    throw new Error('Current user is not an admin');
  }

  if (!newAdmin) {
    throw new Error('New admin is not a member of this group');
  }

  // Transfer roles
  currentAdmin.role = CONSTANTS.USER_ROLES.MEMBER;
  newAdmin.role = CONSTANTS.USER_ROLES.ADMIN;

  return this;
};

// Update statistics
groupSchema.methods.updateStatistics = async function() {
  const Task = mongoose.model('Task');
  const Expense = mongoose.model('Expense');

  // Count tasks
  const totalTasks = await Task.countDocuments({ groupId: this._id });
  const completedTasks = await Task.countDocuments({ 
    groupId: this._id, 
    status: CONSTANTS.TASK_STATUS.COMPLETED 
  });

  // Sum expenses
  const expenseResult = await Expense.aggregate([
    { $match: { groupId: this._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  this.statistics = {
    totalTasks,
    completedTasks,
    totalExpenses: expenseResult.length > 0 ? expenseResult[0].total : 0,
  };

  return this.save();
};

// Transform output (populate member details)
groupSchema.methods.toJSONWithMembers = async function() {
  await this.populate('members.userId', 'name email profilePicture');
  
  const obj = this.toObject();
  
  // Transform members to include user details
  obj.members = obj.members.map(member => ({
    userId: member.userId._id,
    name: member.userId.name,
    email: member.userId.email,
    profilePicture: member.userId.profilePicture,
    role: member.role,
    joinedAt: member.joinedAt,
  }));

  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Group', groupSchema);