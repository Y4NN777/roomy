const express = require('express');
const groupController = require('../../controllers/v1/groupController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership, verifyGroupAdmin } = require('../../middleware/groupPermissions');
const { validate, groupSchemas } = require('../../middleware/validation');

const router = express.Router();

// Defines public routes for group discovery and creation, requiring authentication but not group membership.

// Route to get a list of all public groups.
router.get('/', 
  authenticateToken, 
  groupController.getAllGroups
);

// Route to search for groups by name.
router.get('/search', 
  authenticateToken, 
  groupController.searchGroups
);

// Route to get all groups the current user is a member of.
router.get('/my-groups', 
  authenticateToken, 
  groupController.getMyGroups
);

// Route to create a new group.
router.post('/', 
  authenticateToken, 
  validate(groupSchemas.createGroup), 
  groupController.createGroup
);

// Route to join a group using an invite code.
router.post('/join', 
  authenticateToken, 
  validate(groupSchemas.joinGroup), 
  groupController.joinGroup
);

// Defines routes that require group membership but not admin privileges.
// Route to get a specific group's details.
router.get('/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroup
);

// Route to get statistics for a specific group.
router.get('/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroupStatistics
);

// Route for a user to leave a group.
router.post('/:groupId/leave', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.leaveGroup
);

// Route to get all members of a specific group.
router.get('/:groupId/members',
    authenticateToken, 
    verifyGroupMembership,
    groupController.getGroupMembers
);

// Route to get recent activity for a specific group.
router.get('/:groupId/activity', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroupActivity
);

// Defines routes that require group admin privileges.
// Route to update a group's details.
router.patch('/:groupId', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.updateGroup), 
  groupController.updateGroup
);

// Route to send a group invitation via email.
router.post('/:groupId/invite-email', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.sendEmailInvitation), 
  groupController.sendEmailInvitation
);

// Route to remove a member from a group.
router.delete('/:groupId/members/:userId', 
  authenticateToken, 
  verifyGroupAdmin, 
  groupController.removeMember
);

// Route to transfer admin privileges to another member.
router.patch('/:groupId/transfer-admin', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.transferAdmin), 
  groupController.transferAdmin
);

// Route to regenerate the group's invite code.
router.post('/:groupId/regenerate-invite', 
  authenticateToken, 
  verifyGroupAdmin, 
  groupController.regenerateInviteCode
);

module.exports = router;