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
      }).populate('members.userId', 'name email');

      if (!group) {
        throw new Error('Invalid invite code');
      }

      // Add user to group
      group.addMember(userId);
      await group.save();

      // Update user's groupId
      user.groupId = group._id;
      await user.save();

      if (shouldSendWelcomeEmail) {
        try {
            const admin = group.members.find(member => member.role === 'admin');
            const notificationService = require('./notificationService');
            
            await notificationService.sendWelcomeToGroup({
            userEmail: user.email,
            userName: user.name,
            groupName: group.name,
            memberCount: group.members.length,
            adminName: admin ? admin.userId.name : 'Group Admin'
            });
         }catch (emailError) {
            logger.warn('Welcome email failed, but user joined successfully:', emailError);
         }
        }

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

      if (shouldNotify) {
        try {
            const newAdmin = group.members.find(m => m.userId._id.toString() === newAdminId);
            const currentAdmin = group.members.find(m => m.userId._id.toString() === currentAdminId);
            
            if (newAdmin && currentAdmin) {
            const notificationService = require('./notificationService');
            await notificationService.sendRoleChangeNotification({
                userEmail: newAdmin.userId.email,
                userName: newAdmin.userId.name,
                groupName: group.name,
                newRole: 'admin',
                changedBy: currentAdmin.userId.name
            });
            }
        } catch (emailError) {
            logger.warn('Role change email failed, but transfer completed:', emailError);
        }
      }

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


  async getAllGroups(requestingUserId, filters = {}) {
    try {
      // This could be admin-only or public discovery feature
      const query = { isActive: true };
      
      // Apply filters
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      if (filters.maxMembers) {
        query['members'] = { $size: { $lte: parseInt(filters.maxMembers) } };
      }

      const groups = await Group.find(query)
        .select('name description members.length statistics createdAt')
        .limit(filters.limit || 20)
        .skip(filters.offset || 0)
        .sort({ createdAt: -1 });

      // Transform to hide sensitive info
      const publicGroups = groups.map(group => ({
        _id: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
        maxMembers: group.settings?.maxMembers || 10,
        isAvailable: group.members.length < (group.settings?.maxMembers || 10),
        createdAt: group.createdAt,
        statistics: group.statistics
      }));

      return {
        groups: publicGroups,
        total: await Group.countDocuments(query),
        hasMore: (filters.offset || 0) + publicGroups.length < await Group.countDocuments(query)
      };
    } catch (error) {
      logger.error('Get all groups error:', error);
      throw error;
    }
  }



async sendEmailInvitation(groupId, recipientEmail, requestingUserId, customMessage = '') {
  try {
    const group = await Group.findById(groupId).populate('members.userId', 'name email');
    
    if (!group || !group.isActive) {
      throw new Error('Group not found');
    }

    // Check if email is already a member
    const existingMember = group.members.find(member => 
      member.userId.email.toLowerCase() === recipientEmail.toLowerCase()
    );
    
    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    // Get inviter details
    const inviter = group.members.find(member => 
      member.userId._id.toString() === requestingUserId
    );

    if (!inviter) {
      throw new Error('Inviter not found in group');
    }

    // Send invitation email
    const notificationService = require('./notificationService');
    const emailResult = await notificationService.sendGroupInvitation({
      recipientEmail,
      inviterName: inviter.userId.name,
      groupName: group.name,
      inviteCode: group.inviteCode,
      customMessage
    });

    if (emailResult.success) {
      logger.info(`Email invitation sent to ${recipientEmail} for group ${groupId} by ${requestingUserId}`);
      
      return {
        success: true,
        recipientEmail,
        inviteCode: group.inviteCode,
        inviterName: inviter.userId.name,
        groupName: group.name,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }
  } catch (error) {
    logger.error('Send email invitation error:', error);
    throw error;
  }
}



async getGroupMembers(groupId, requestingUserId, includeDetails = false) {
try {
    // Since verifyGroupMembership middleware already verified access,
    // we can trust that the user is a member and just get the group
    const group = await Group.findById(groupId).populate({
    path: 'members.userId',
    select: includeDetails 
        ? 'name email profilePicture lastLoginAt preferences.theme createdAt'
        : 'name email profilePicture'
    });

    if (!group || !group.isActive) {
    throw new Error('Group not found');
    }

    // Get requesting member info (we know they exist due to middleware)
    const requestingMember = group.findMember(requestingUserId);
    console.log('Requesting Member:', requestingMember);
    const isAdmin = requestingMember && requestingMember.role === CONSTANTS.USER_ROLES.ADMIN;

    // Transform members data
    const members = group.members.map(member => {
    const memberData = {
        userId: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
        profilePicture: member.userId.profilePicture,
        role: member.role,
        joinedAt: member.joinedAt,
        isOnline: member.userId.lastLoginAt && 
                (new Date() - new Date(member.userId.lastLoginAt)) < 15 * 60 * 1000 // 15 minutes
    };

    // Add detailed info for admins or include details request
    if (isAdmin || includeDetails) {
        memberData.lastLoginAt = member.userId.lastLoginAt;
        memberData.theme = member.userId.preferences?.theme;
        memberData.memberSince = member.userId.createdAt;
    }

    return memberData;
    });

    return {
      groupId: group._id,
      groupName: group.name,
      totalMembers: members.length,
      maxMembers: group.settings.maxMembers,
      members: members.sort((a, b) => {
        // Sort: admins first, then by join date
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      }),
      requestingUserRole: requestingMember ? requestingMember.role : 'member'
    };
  } catch (error) {
    logger.error('Get group members error:', error);
    throw error;
  }
}

  async getGroupActivity(groupId, requestingUserId, limit = 20) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify user is a member
      if (!group.isMember(requestingUserId)) {
        throw new Error('Access denied');
      }

      // This would typically come from an Activity/Log model
      // For now, we'll return member join history and basic stats
      const memberHistory = group.members.map(member => ({
        type: 'member_joined',
        userId: member.userId,
        timestamp: member.joinedAt,
        data: { role: member.role }
      }));

      // Sort by timestamp (most recent first)
      const activity = memberHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return {
        groupId: group._id,
        activity,
        hasMore: memberHistory.length > limit
      };
    } catch (error) {
      logger.error('Get group activity error:', error);
      throw error;
    }
  }

  async updateMemberRole(groupId, targetUserId, newRole, requestingUserId) {
    try {
      const group = await Group.findById(groupId);

      if (!group || !group.isActive) {
        throw new Error('Group not found');
      }

      // Verify requesting user is admin
      if (!group.isAdmin(requestingUserId)) {
        throw new Error('Admin privileges required');
      }

      const targetMember = group.findMember(targetUserId);
      if (!targetMember) {
        throw new Error('Target user is not a member of this group');
      }

      // Cannot change your own role (use transfer admin instead)
      if (targetUserId === requestingUserId) {
        throw new Error('Cannot change your own role. Use transfer admin instead.');
      }

      // Validate new role
      if (!Object.values(CONSTANTS.USER_ROLES).includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      // If promoting to admin, demote current admin
      if (newRole === CONSTANTS.USER_ROLES.ADMIN) {
        const currentAdmin = group.members.find(m => m.userId.toString() === requestingUserId);
        currentAdmin.role = CONSTANTS.USER_ROLES.MEMBER;
      }

      targetMember.role = newRole;
      await group.save();

      logger.info(`User ${targetUserId} role changed to ${newRole} in group ${groupId} by ${requestingUserId}`);

      return await group.toJSONWithMembers();
    } catch (error) {
      logger.error('Update member role error:', error);
      throw error;
    }
  }

  async searchGroups(searchQuery, requestingUserId, filters = {}) {
    try {
      const query = {
        isActive: true,
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      // Only show groups that aren't full
      if (filters.availableOnly !== false) {
        query.$expr = {
          $lt: [{ $size: '$members' }, '$settings.maxMembers']
        };
      }

      const groups = await Group.find(query)
        .select('name description members settings statistics createdAt')
        .limit(filters.limit || 10)
        .sort({ 'statistics.totalTasks': -1, memberCount: 1 }); // Active groups first

      const searchResults = groups.map(group => ({
        _id: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
        maxMembers: group.settings.maxMembers,
        isAvailable: group.members.length < group.settings.maxMembers,
        activityScore: group.statistics.totalTasks + group.statistics.completedTasks,
        createdAt: group.createdAt
      }));

      return {
        query: searchQuery,
        results: searchResults,
        total: searchResults.length
      };
    } catch (error) {
      logger.error('Search groups error:', error);
      throw error;
    }
  }

  async getMyGroups(userId) {
    try {
      // For future multi-group support
      const user = await User.findById(userId).populate({
        path: 'groupId',
        select: 'name description members statistics inviteCode'
      });

      if (!user || !user.isActive) {
        throw new Error('User not found');
      }

      const groups = [];
      if (user.groupId) {
        const group = user.groupId;
        const member = group.members.find(m => m.userId.toString() === userId);
        
        groups.push({
          _id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
          myRole: member ? member.role : 'member',
          joinedAt: member ? member.joinedAt : null,
          statistics: group.statistics,
          inviteCode: member && member.role === 'admin' ? group.inviteCode : undefined
        });
      }

      return {
        groups,
        total: groups.length
      };
    } catch (error) {
      logger.error('Get my groups error:', error);
      throw error;
    }
  }

}



module.exports = new GroupService();