const express = require('express');
const groupController = require('../../controllers/v1/groupController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership, verifyGroupAdmin } = require('../../middleware/groupPermissions');
const { validate, groupSchemas } = require('../../middleware/validation');

const router = express.Router();

// Public routes (require authentication but no group membership)
router.post('/', 
  authenticateToken, 
  validate(groupSchemas.createGroup), 
  groupController.createGroup
);

router.post('/join', 
  authenticateToken, 
  validate(groupSchemas.joinGroup), 
  groupController.joinGroup
);

// Group member routes (require group membership)
router.get('/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroup
);

router.get('/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroupStatistics
);

router.post('/:groupId/leave', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.leaveGroup
);

// Admin-only routes
router.patch('/:groupId', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.updateGroup), 
  groupController.updateGroup
);

router.delete('/:groupId/members/:userId', 
  authenticateToken, 
  verifyGroupAdmin, 
  groupController.removeMember
);

router.patch('/:groupId/transfer-admin', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.transferAdmin), 
  groupController.transferAdmin
);

router.post('/:groupId/regenerate-invite', 
  authenticateToken, 
  verifyGroupAdmin, 
  groupController.regenerateInviteCode
);

module.exports = router;