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

// Defining indexes for improved query performance.
groupSchema.index({unique: true });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ isActive: 1 });

// A static method to generate a unique invite code for the group.
groupSchema.statics.generateInviteCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = CONSTANTS.MAX_INVITE_CODE_ATTEMPTS;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < CONSTANTS.INVITE_CODE_LENGTH; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Checking if the generated code already exists in the database.
    const existingGroup = await this.findOne({ inviteCode: code });
    if (!existingGroup) {
      return code;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique invite code');
};

// A method to find a member within the group by their user ID.
groupSchema.methods.findMember = function(userId) {
  return this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
};

// A method to check if a user has admin privileges in the group.
groupSchema.methods.isAdmin = function(userId) {
  const member = this.findMember(userId);
  return member && member.role === CONSTANTS.USER_ROLES.ADMIN;
};

// A method to check if a user is a member of the group, regardless of their role.
groupSchema.methods.isMember = function(userId) {
  return !!this.findMember(userId);
};

// A method to add a new member to the group.
groupSchema.methods.addMember = function(userId, role = CONSTANTS.USER_ROLES.MEMBER) {
  // Preventing a user from being added to the group if they are already a member.
  if (this.isMember(userId)) {
    throw new Error('User is already a member of this group');
  }

  // Ensuring the group has not reached its maximum member capacity.
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

// A method to remove a member from the group.
groupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }

  const member = this.members[memberIndex];
  
  // Preventing the last admin from being removed to avoid orphaning the group.
  const adminCount = this.members.filter(m => m.role === CONSTANTS.USER_ROLES.ADMIN).length;
  if (member.role === CONSTANTS.USER_ROLES.ADMIN && adminCount === 1) {
    throw new Error('Cannot remove the last admin. Transfer admin role first.');
  }

  this.members.splice(memberIndex, 1);
  return this;
};

// A method to transfer the admin role from one member to another.
groupSchema.methods.transferAdmin = function(currentAdminId, newAdminId) {
  const currentAdmin = this.findMember(currentAdminId);
  const newAdmin = this.findMember(newAdminId);

  if (!currentAdmin || currentAdmin.role !== CONSTANTS.USER_ROLES.ADMIN) {
    throw new Error('Current user is not an admin');
  }

  if (!newAdmin) {
    throw new Error('New admin is not a member of this group');
  }

  // Performing the role transfer between the current and new admin.
  currentAdmin.role = CONSTANTS.USER_ROLES.MEMBER;
  newAdmin.role = CONSTANTS.USER_ROLES.ADMIN;

  return this;
};

// A method to update the group's statistics, such as task and expense counts.
groupSchema.methods.updateStatistics = async function() {
  const Task = mongoose.model('Task');
  const Expense = mongoose.model('Expense');

  // Counting the total and completed tasks for the group.
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