const express = require('express');
const groupController = require('../../controllers/v1/groupController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership, verifyGroupAdmin } = require('../../middleware/groupPermissions');
const { validate, groupSchemas } = require('../../middleware/validation');

const router = express.Router();



/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         inviteCode:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         adminId:
 *           type: string
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GroupMember'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64abc123def456789"
 *         name: "House Roommates"
 *         description: "Managing our shared apartment"
 *         inviteCode: "ABC123"
 *         isPublic: false
 *         adminId: "64abc123def456789"
 *     
 *     GroupMember:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, member]
 *         joinedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateGroupRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         isPublic:
 *           type: boolean
 *           default: false
 *       example:
 *         name: "House Roommates"
 *         description: "Managing our shared apartment"
 *         isPublic: false
 *     
 *     JoinGroupRequest:
 *       type: object
 *       required:
 *         - inviteCode
 *       properties:
 *         inviteCode:
 *           type: string
 *       example:
 *         inviteCode: "ABC123"
 *     
 *     GroupStatistics:
 *       type: object
 *       properties:
 *         totalMembers:
 *           type: integer
 *         totalTasks:
 *           type: integer
 *         completedTasks:
 *           type: integer
 *         totalExpenses:
 *           type: number
 *         pendingExpenses:
 *           type: number
 * 
 * tags:
 *   - name: Groups
 *     description: Group management and membership
 */


// Defines public routes for group discovery and creation, requiring authentication but not group membership.

// Route to get a list of all public groups.
/**
 * @swagger
 * /api/v1/groups:
 *   get:
 *     summary: Get all public groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: List of public groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalGroups:
 *                       type: integer
 */

router.get('/', 
  authenticateToken, 
  groupController.getAllGroups
);

// Route to search for groups by name.

/**
 * @swagger
 * /api/v1/groups/search:
 *   get:
 *     summary: Search groups by name
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
router.get('/search', 
  authenticateToken, 
  groupController.searchGroups
);


/**
 * @swagger
 * /api/v1/groups/my-groups:
 *   get:
 *     summary: Get user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
// Route to get all groups the current user is a member of.
router.get('/my-groups', 
  authenticateToken, 
  groupController.getMyGroups
);

/**
 * @swagger
 * /api/v1/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRequest'
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
// Route to create a new group.
router.post('/', 
  authenticateToken, 
  validate(groupSchemas.createGroup), 
  groupController.createGroup
);



/**
 * @swagger
 * /api/v1/groups/join:
 *   post:
 *     summary: Join a group using invite code
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinGroupRequest'
 *     responses:
 *       200:
 *         description: Successfully joined group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
// Route to join a group using an invite code.
router.post('/join', 
  authenticateToken, 
  validate(groupSchemas.joinGroup), 
  groupController.joinGroup
);


/**
 * @swagger
 * /api/v1/groups/{groupId}:
 *   get:
 *     summary: Get group details
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
// Defines routes that require group membership but not admin privileges.
// Route to get a specific group's details.
router.get('/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroup
);


/**
 * @swagger
 * /api/v1/groups/{groupId}/statistics:
 *   get:
 *     summary: Get group statistics
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupStatistics'
 */
// Route to get statistics for a specific group.
router.get('/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroupStatistics
);


/**
 * @swagger
 * /api/v1/groups/{groupId}/leave:
 *   post:
 *     summary: Leave a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Successfully left the group"
 *       400:
 *         description: Cannot leave group (e.g., you're the admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route for a user to leave a group.
router.post('/:groupId/leave', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.leaveGroup
);

/**
 * @swagger
 * /api/v1/groups/{groupId}/members:
 *   get:
 *     summary: Get group members
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupMember'
 */
// Route to get all members of a specific group.
router.get('/:groupId/members',
    authenticateToken, 
    verifyGroupMembership,
    groupController.getGroupMembers
);



/**
 * @swagger
 * /api/v1/groups/{groupId}/activity:
 *   get:
 *     summary: Get recent activity for a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of activity items to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [task, expense, member, group]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Group activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [task_created, task_completed, expense_added, expense_paid, member_joined, member_left]
 *                   description:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   userName:
 *                     type: string
 *                   data:
 *                     type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *               example:
 *                 - id: "64abc123def456789"
 *                   type: "task_created"
 *                   description: "John created a new task: Clean kitchen"
 *                   userId: "64abc123def456789"
 *                   userName: "John Doe"
 *                   data:
 *                     taskId: "64def456abc123789"
 *                     taskTitle: "Clean kitchen"
 *                   createdAt: "2023-01-15T10:30:00Z"
 */
// Route to get recent activity for a specific group.
router.get('/:groupId/activity', 
  authenticateToken, 
  verifyGroupMembership, 
  groupController.getGroupActivity
);


/**
 * @swagger
 * /api/v1/groups/{groupId}:
 *   patch:
 *     summary: Update group details (Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               isPublic:
 *                 type: boolean
 *             example:
 *               name: "Updated Group Name"
 *               description: "Updated description"
 *               isPublic: true
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       403:
 *         description: Insufficient permissions (not group admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Defines routes that require group admin privileges.
// Route to update a group's details.
router.patch('/:groupId', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.updateGroup), 
  groupController.updateGroup
);


/**
 * @swagger
 * /api/v1/groups/{groupId}/invite-email:
 *   post:
 *     summary: Send group invitation via email (Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               message:
 *                 type: string
 *                 maxLength: 500
 *             example:
 *               email: "friend@example.com"
 *               message: "Join our group to manage tasks and expenses together!"
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Invitation sent successfully"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route to send a group invitation via email.
router.post('/:groupId/invite-email', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.sendEmailInvitation), 
  groupController.sendEmailInvitation
);


/**
 * @swagger
 * /api/v1/groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from the group (Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Member removed successfully"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route to remove a member from a group.
router.delete('/:groupId/members/:userId', 
  authenticateToken, 
  verifyGroupAdmin, 
  groupController.removeMember
);


/**
 * @swagger
 * /api/v1/groups/{groupId}/transfer-admin:
 *   patch:
 *     summary: Transfer admin privileges to another member (Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAdminId
 *             properties:
 *               newAdminId:
 *                 type: string
 *             example:
 *               newAdminId: "64def456abc123789"
 *     responses:
 *       200:
 *         description: Admin privileges transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *               example:
 *                 message: "Admin privileges transferred successfully"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route to transfer admin privileges to another member.
router.patch('/:groupId/transfer-admin', 
  authenticateToken, 
  verifyGroupAdmin, 
  validate(groupSchemas.transferAdmin), 
  groupController.transferAdmin
);


/**
 * @swagger
 * /api/v1/groups/{groupId}/regenerate-invite:
 *   post:
 *     summary: Regenerate the group invite code (Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite code regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newInviteCode:
 *                   type: string
 *               example:
 *                 message: "Invite code regenerated successfully"
 *                 newInviteCode: "ABC123XYZ"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route to regenerate the group's invite code.
router.post('/:groupId/regenerate-invite', 
  authenticateToken, 
  verifyGroupAdmin, 
  groupController.regenerateInviteCode
);

module.exports = router;