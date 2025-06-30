const Group = require('../models/Group');
const responseHelper = require('../utils/responseHelper');
const CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger');

// Verify user is a member of the group (admin or regular member)
const verifyGroupMembership = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    const userId = req.user.id;

    if (!groupId) {
      return responseHelper.error(res, 'Group ID is required', 400, 'MISSING_GROUP_ID');
    }

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return responseHelper.notFound(res, 'Group not found');
    }

    const member = group.findMember(userId);
    if (!member) {
      return responseHelper.forbidden(res, 'Access denied - not a group member');
    }

    // Attach group and user role to request
    req.group = group;
    req.userRole = member.role;
    req.memberInfo = member;

    next();
  } catch (error) {
    logger.error('Group membership verification error:', error);
    return responseHelper.error(res, 'Failed to verify group membership', 500);
  }
};

// Verify user is an admin of the group
const verifyGroupAdmin = async (req, res, next) => {
  try {
    // First verify membership
    await verifyGroupMembership(req, res, (err) => {
      if (err) return next(err);

      // Then check admin role
      if (req.userRole !== CONSTANTS.USER_ROLES.ADMIN) {
        return responseHelper.forbidden(res, 'Admin privileges required');
      }

      next();
    });
  } catch (error) {
    logger.error('Group admin verification error:', error);
    return responseHelper.error(res, 'Failed to verify admin privileges', 500);
  }
};

// Optional group membership check (for endpoints that work with or without group context)
const optionalGroupMembership = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return next(); // Continue without group context
    }

    // If group ID is provided, verify membership
    return verifyGroupMembership(req, res, next);
  } catch (error) {
    logger.error('Optional group membership error:', error);
    return next(); // Continue without group context on error
  }
};

// Check if user can perform action on resource (admin or resource owner)
const verifyResourceAccess = (resourceOwnerField = 'createdBy') => {
  return (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.userRole;
      
      // Admin can access any resource
      if (userRole === CONSTANTS.USER_ROLES.ADMIN) {
        return next();
      }

      // Check if user owns the resource
      const resourceOwnerId = req.body[resourceOwnerField] || 
                             req.params[resourceOwnerField] ||
                             (req.resource && req.resource[resourceOwnerField]);

      if (resourceOwnerId && resourceOwnerId.toString() === userId) {
        return next();
      }

      return responseHelper.forbidden(res, 'Access denied - insufficient permissions');
    } catch (error) {
      logger.error('Resource access verification error:', error);
      return responseHelper.error(res, 'Failed to verify resource access', 500);
    }
  };
};

module.exports = {
  verifyGroupMembership,
  verifyGroupAdmin,
  optionalGroupMembership,
  verifyResourceAccess,
};