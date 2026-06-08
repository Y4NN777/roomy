const Group = require('../models/Group');
const responseHelper = require('../utils/responseHelper');
const CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger');

// Middleware to verify that the authenticated user is a member of the specified group.
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

    // Attaches the group, user's role, and member information to the request object for use in subsequent middleware or controllers.
    req.group = group;
    req.userRole = member.role;
    req.memberInfo = member;

    next();
  } catch (error) {
    logger.error('Group membership verification error:', error);
    return responseHelper.error(res, 'Failed to verify group membership', 500);
  }
};

// Middleware to verify that the authenticated user is an admin of the specified group.
const verifyGroupAdmin = async (req, res, next) => {
  try {
    // First, verifies that the user is a member of the group.
    await verifyGroupMembership(req, res, (err) => {
      if (err) return next(err);

      // Then, checks if the user has an admin role.
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

// Middleware for optional group membership, allowing access to endpoints that behave differently for group members and non-members.
const optionalGroupMembership = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return next(); // If no group ID is provided, continues the request flow without group context.
    }

    // If a group ID is provided, proceeds with standard membership verification.
    return verifyGroupMembership(req, res, next);
  } catch (error) {
    logger.error('Optional group membership error:', error);
    return next(); // On error, continues the request flow without group context.
  }
};

// Middleware factory to create a middleware that verifies if a user can perform an action on a resource, checking for admin role or resource ownership.
const verifyResourceAccess = (resourceOwnerField = 'createdBy') => {
  return (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.userRole;
      
      // Admins are granted access to any resource within the group.
      if (userRole === CONSTANTS.USER_ROLES.ADMIN) {
        return next();
      }

      // Checks if the user is the owner of the resource.
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