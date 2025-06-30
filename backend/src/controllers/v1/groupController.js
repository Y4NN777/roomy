const groupService = require('../../services/groupService');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../utils/logger');

class GroupController {
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

  async joinGroup(req, res, next) {
    try {
      const { inviteCode } = req.body;
      const group = await groupService.joinGroup(inviteCode, req.user.id);
      
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

  async transferAdmin(req, res, next) {
    try {
      const { groupId } = req.params;
      const { newAdminId } = req.body;
      const group = await groupService.transferAdmin(groupId, newAdminId, req.user.id);
      
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
}

module.exports = new GroupController();