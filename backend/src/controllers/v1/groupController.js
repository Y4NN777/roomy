const groupService = require('../../services/groupService');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../utils/logger');

// A controller for managing groups, including creation, membership, and administration.
class GroupController {
    // Creates a new group and assigns the current user as its administrator.
  async createGroup(req, res, next) {
    try {
      const group = await groupService.createGroup(req.body, req.user.id);
      
      responseHelper.success(
        res,
        'Group created successfully',
        { group },
        201
      );
    } catch (error) {
      if (error.message === 'User is already a member of another group') {
        return responseHelper.error(
          res,
          error.message,
          409,
          'ALREADY_IN_GROUP'
        );
      }
      next(error);
    }
  }

    // Allows a user to join an existing group using an invite code.
  async joinGroup(req, res, next) {
    try {
      const { inviteCode } = req.body;
      
      // A welcome email will be sent to the user upon successfully joining the group.
      const group = await groupService.joinGroup(inviteCode, req.user.id, true);
      
      responseHelper.success(
        res,
        'Successfully joined group',
        { group }
      );
    } catch (error) {
      if (error.message === 'Invalid invite code') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'User is already a member of another group') {
        return responseHelper.error(
          res,
          error.message,
          409,
          'ALREADY_IN_GROUP'
        );
      }
      if (error.message === 'Group has reached maximum capacity') {
        return responseHelper.error(
          res,
          error.message,
          409,
          'GROUP_FULL'
        );
      }
      next(error);
    }
  }

    // Retrieves the details of a specific group.
  async getGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      const group = await groupService.getGroup(groupId, req.user.id);
      
      responseHelper.success(
        res,
        'Group retrieved successfully',
        { group }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Access denied') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Updates the details of a specific group.
  async updateGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      const group = await groupService.updateGroup(groupId, req.body, req.user.id);
      
      responseHelper.success(
        res,
        'Group updated successfully',
        { group }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Admin privileges required') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Removes a member from a group. Only administrators can perform this action.
  async removeMember(req, res, next) {
    try {
      const { groupId, userId } = req.params;
      const group = await groupService.removeMember(groupId, userId, req.user.id);
      
      responseHelper.success(
        res,
        'Member removed successfully',
        { group }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('Admin privileges required') ||
          error.message.includes('Cannot remove')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Transfers the administrator role to another member of the group.
  async transferAdmin(req, res, next) {
    try {
      const { groupId } = req.params;
      const { newAdminId } = req.body;
      const group = await groupService.transferAdmin(groupId, newAdminId, req.user.id, true);
      
      responseHelper.success(
        res,
        'Admin role transferred successfully',
        { group }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('admin') || error.message.includes('member')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Allows a user to leave their current group.
  async leaveGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await groupService.leaveGroup(groupId, req.user.id);
      
      responseHelper.success(
        res,
        result.message
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('Cannot leave') || 
          error.message.includes('not a member')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Regenerates the invite code for a group. Only administrators can perform this action.
  async regenerateInviteCode(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await groupService.regenerateInviteCode(groupId, req.user.id);
      
      responseHelper.success(
        res,
        result.message,
        { inviteCode: result.inviteCode }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Admin privileges required') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Retrieves statistics for a specific group, such as member count and task distribution.
  async getGroupStatistics(req, res, next) {
    try {
      const { groupId } = req.params;
      const statistics = await groupService.getGroupStatistics(groupId, req.user.id);
      
      responseHelper.success(
        res,
        'Statistics retrieved successfully',
        { statistics }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Access denied') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async getAllGroups(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        maxMembers: req.query.maxMembers,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await groupService.getAllGroups(req.user.id, filters);
      
      responseHelper.success(
        res,
        'Groups retrieved successfully',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getGroupMembers(req, res, next) {
    try {
        const includeDetails = req.query.details === 'true';
        
        // Using the group and role information from the middleware.
        // The req.group and req.userRole properties are set by the verifyGroupMembership middleware.
        const group = req.group;
        const requestingUserRole = req.userRole;
        
        // Populating the member details.
        await group.populate({
        path: 'members.userId',
        select: includeDetails 
            ? 'name email profilePicture lastLoginAt preferences.theme createdAt'
            : 'name email profilePicture'
        });

        const isAdmin = requestingUserRole === 'admin';

        // Transforming the members' data for the response.
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

        // Adding detailed information for admins or when details are requested.
        if (isAdmin || includeDetails) {
            memberData.lastLoginAt = member.userId.lastLoginAt;
            memberData.theme = member.userId.preferences?.theme;
            memberData.memberSince = member.userId.createdAt;
        }

        return memberData;
        });

        const result = {
        groupId: group._id,
        groupName: group.name,
        totalMembers: members.length,
        maxMembers: group.settings.maxMembers,
        members: members.sort((a, b) => {
            // Sorting the members: admins first, then by join date.
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return new Date(a.joinedAt) - new Date(b.joinedAt);
        }),
        requestingUserRole: requestingUserRole
        };
        
        responseHelper.success(
        res,
        'Group members retrieved successfully',
        result
        );
    } catch (error) {
        next(error);
    }
    }

  async getGroupActivity(req, res, next) {
    try {
      const { groupId } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      
      const activity = await groupService.getGroupActivity(groupId, req.user.id, limit);
      
      responseHelper.success(
        res,
        'Group activity retrieved successfully',
        activity
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Access denied') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const { groupId, userId } = req.params;
      const { role } = req.body;
      
      const group = await groupService.updateMemberRole(groupId, userId, role, req.user.id);
      
      responseHelper.success(
        res,
        'Member role updated successfully',
        { group }
      );
    } catch (error) {
      if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('Admin privileges') || 
          error.message.includes('Cannot change')) {
        return responseHelper.forbidden(res, error.message);
      }
      if (error.message.includes('Invalid role')) {
        return responseHelper.error(res, error.message, 400, 'INVALID_ROLE');
      }
      next(error);
    }
  }

  async searchGroups(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return responseHelper.error(
          res, 
          'Search query must be at least 2 characters', 
          400, 
          'INVALID_SEARCH_QUERY'
        );
      }

      const filters = {
        availableOnly: req.query.available !== 'false',
        limit: parseInt(req.query.limit) || 10
      };

      const results = await groupService.searchGroups(q.trim(), req.user.id, filters);
      
      responseHelper.success(
        res,
        'Group search completed',
        results
      );
    } catch (error) {
      next(error);
    }
  }

  async sendEmailInvitation(req, res, next) {
    try {
        const { groupId } = req.params;
        const { email, message } = req.body;
        
        const result = await groupService.sendEmailInvitation(
        groupId, 
        email, 
        req.user.id, 
        message
        );
        
        responseHelper.success(
        res,
        'Invitation email sent successfully',
        {
            recipientEmail: result.recipientEmail,
            inviteCode: result.inviteCode,
            groupName: result.groupName
        }
        );
    } catch (error) {
        if (error.message === 'Group not found') {
        return responseHelper.notFound(res, error.message);
        }
        if (error.message === 'Admin privileges required') {
        return responseHelper.forbidden(res, error.message);
        }
        if (error.message === 'User is already a member of this group') {
        return responseHelper.error(res, error.message, 409, 'ALREADY_MEMBER');
        }
        if (error.message.includes('Failed to send email')) {
        return responseHelper.error(res, error.message, 500, 'EMAIL_SEND_FAILED');
        }
        next(error);
    }
  }

  async getMyGroups(req, res, next) {
    try {
      const groups = await groupService.getMyGroups(req.user.id);
      
      responseHelper.success(
        res,
        'Your groups retrieved successfully',
        groups
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return responseHelper.notFound(res, error.message);
      }
      next(error);
    }
  }

}

module.exports = new GroupController();