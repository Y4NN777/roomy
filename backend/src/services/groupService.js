const Group = require('../models/Group');
const User = require('../models/User');
const logger = require('../utils/logger');
const CONSTANTS = require('../utils/constants');

class GroupService {
  async createGroup(groupData, creatorId) {
    try {
      // Check if user is already in a group
      const existingUser = await User.findById(creatorId);
      if (existingUser.groupId) {
        throw new Error('User is already a member of another group');
      }

      // Generate unique invite code
      const inviteCode = await Group.generateInviteCode();

      // Create group with creator as admin
      const group = new Group({
        ...groupData,
        inviteCode,
        members: [{
          userId: creatorId,
          role: CONSTANTS.USER_ROLES.ADMIN,
          joinedAt: new Date(),
        }],
      });

      await group.save();

      // Update user's groupId
      existingUser.groupId = group._id;
      await existingUser.save();

      logger.info(`Group created: ${group.name} by user ${creatorId}`);

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Create group error:', error);
      throw error;
    }
  }

  async joinGroup(inviteCode, userId) {
    try {
      // Check if user is already in a group
      const user = await User.findById(userId);
      if (user.groupId) {
        throw new Error('User is already a member of another group');
      }

      // Find group by invite code
      const group = await Group.findOne({ 
        inviteCode: inviteCode.toUpperCase(), 
        isActive: true 
      });

      if (!group) {
        throw new Error('Invalid invite code');
      }

      // Add user to group
      group.addMember(userId);
      await group.save();

      // Update user's groupId
      user.groupId = group._id;
      await user.save();

      logger.info(`User ${userId} joined group ${group.name}`);

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Join group error:', error);
      throw error;
    }
  }

  async getGroup(groupId, requestingUserId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify user is a member
      if (!group.isMember(requestingUserId)) {
        throw new Error('Access denied');
      }

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Get group error:', error);
      throw error;
    }
  }

  async updateGroup(groupId, updateData, requestingUserId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify user is admin
      if (!group.isAdmin(requestingUserId)) {
        throw new Error('Admin privileges required');
      }

      // Update allowed fields
      if (updateData.name) group.name = updateData.name;
      if (updateData.description !== undefined) group.description = updateData.description;
      if (updateData.settings) {
        group.settings = { ...group.settings, ...updateData.settings };
      }

      await group.save();

      logger.info(`Group ${groupId} updated by user ${requestingUserId}`);

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Update group error:', error);
      throw error;
    }
  }

  async removeMember(groupId, memberToRemoveId, requestingUserId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify requesting user is admin
      if (!group.isAdmin(requestingUserId)) {
        throw new Error('Admin privileges required');
      }

      // Cannot remove self
      if (memberToRemoveId === requestingUserId) {
        throw new Error('Cannot remove yourself. Transfer admin role first.');
      }

      // Remove member from group
      group.removeMember(memberToRemoveId);
      await group.save();

      // Update removed user's groupId
      await User.findByIdAndUpdate(memberToRemoveId, { groupId: null });

      logger.info(`User ${memberToRemoveId} removed from group ${groupId} by ${requestingUserId}`);

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Remove member error:', error);
      throw error;
    }
  }

  async transferAdmin(groupId, newAdminId, currentAdminId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Transfer admin role
      group.transferAdmin(currentAdminId, newAdminId);
      await group.save();

      logger.info(`Admin role transferred from ${currentAdminId} to ${newAdminId} in group ${groupId}`);

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Transfer admin error:', error);
      throw error;
    }
  }

  async leaveGroup(groupId, userId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      const member = group.findMember(userId);
      if (!member) {
        throw new Error('User is not a member of this group');
      }

      // Check if user is the last admin
      const adminCount = group.members.filter(m => m.role === CONSTANTS.USER_ROLES.ADMIN).length;
      if (member.role === CONSTANTS.USER_ROLES.ADMIN && adminCount === 1) {
        throw new Error('Cannot leave group as the last admin. Transfer admin role first.');
      }

      // Remove user from group
      group.removeMember(userId);
      await group.save();

      // Update user's groupId
      await User.findByIdAndUpdate(userId, { groupId: null });

      logger.info(`User ${userId} left group ${groupId}`);

      return { message: 'Successfully left the group' };
    } catch (error) {
      logger.error('Leave group error:', error);
      throw error;
    }
  }

  async regenerateInviteCode(groupId, requestingUserId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify user is admin
      if (!group.isAdmin(requestingUserId)) {
        throw new Error('Admin privileges required');
      }

      // Generate new invite code
      group.inviteCode = await Group.generateInviteCode();
      await group.save();

      logger.info(`Invite code regenerated for group ${groupId} by user ${requestingUserId}`);

      return {
        inviteCode: group.inviteCode,
        message: 'Invite code regenerated successfully',
      };
    } catch (error) {
      logger.error('Regenerate invite code error:', error);
      throw error;
    }
  }

  async getGroupStatistics(groupId, requestingUserId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify user is a member
      if (!group.isMember(requestingUserId)) {
        throw new Error('Access denied');
      }

      // Update and return statistics
      await group.updateStatistics();

      return group.statistics;
    } catch (error) {
      logger.error('Get group statistics error:', error);
      throw error;
    }
  }
}

module.exports = new GroupService();