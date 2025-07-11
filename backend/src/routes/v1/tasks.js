const express = require('express');
const taskController = require('../../controllers/v1/taskController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership } = require('../../middleware/groupPermissions');
const { validate, taskSchemas } = require('../../middleware/validation');

const router = express.Router();


/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [cleaning, cooking, shopping, maintenance, bills, other]
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *         assignedTo:
 *           type: string
 *         groupId:
 *           type: string
 *         estimatedDuration:
 *           type: integer
 *           description: Duration in minutes
 *         dueDate:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TaskNote'
 *       example:
 *         id: "64abc123def456789"
 *         title: "Clean the kitchen"
 *         description: "Deep clean all surfaces and appliances"
 *         category: "cleaning"
 *         priority: "medium"
 *         status: "pending"
 *         estimatedDuration: 60
 *     
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - title
 *         - groupId
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description:
 *           type: string
 *           maxLength: 1000
 *         category:
 *           type: string
 *           enum: [cleaning, cooking, shopping, maintenance, bills, other]
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *         groupId:
 *           type: string
 *         assignedTo:
 *           type: string
 *         estimatedDuration:
 *           type: integer
 *           minimum: 5
 *           maximum: 480
 *         dueDate:
 *           type: string
 *           format: date-time
 *       example:
 *         title: "Clean the kitchen"
 *         description: "Deep clean all surfaces"
 *         category: "cleaning"
 *         priority: "medium"
 *         groupId: "64abc123def456789"
 *         estimatedDuration: 60
 *     
 *     TaskNote:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         authorId:
 *           type: string
 *         authorName:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     TaskStatistics:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         completed:
 *           type: integer
 *         pending:
 *           type: integer
 *         inProgress:
 *           type: integer
 *         byCategory:
 *           type: object
 *         byPriority:
 *           type: object
 * 
 * tags:
 *   - name: Tasks
 *     description: Task management within groups
 */


/**
 * @swagger
 * /api/v1/tasks/my-tasks:
 *   get:
 *     summary: Get all tasks assigned to current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: User's tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
// Defines routes for managing a user's personal tasks.
// Route to get all tasks assigned to the current user across all groups.
router.get('/my-tasks', 
  authenticateToken, 
  taskController.getUserTasks
);


/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
// Defines routes for managing tasks within a specific group.
// Route to create a new task in a group.
router.post('/', 
  authenticateToken, 
  validate(taskSchemas.createTask), 
  taskController.createTask
);


/**
 * @swagger
 * /api/v1/tasks/group/{groupId}:
 *   get:
 *     summary: Get all tasks for a group
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
// Route to get all tasks for a specific group.
router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  taskController.getTasks
);


/**
 * @swagger
 * /api/v1/tasks/group/{groupId}/statistics:
 *   get:
 *     summary: Get task statistics for a group
 *     tags: [Tasks]
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
 *         description: Task statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskStatistics'
 */
// Route to get task statistics for a specific group.
router.get('/group/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  taskController.getTaskStatistics
);


/**
 * @swagger
 * /api/v1/tasks/group/{groupId}/statistics:
 *   get:
 *     summary: Get task statistics for a group
 *     tags: [Tasks]
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
 *         description: Task statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskStatistics'
 */
// Defines routes for managing individual tasks.
// Route to get a single task by its ID.
router.get('/:taskId', 
  authenticateToken, 
  taskController.getTask
);


/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
// Route to update an existing task.
router.patch('/:taskId', 
  authenticateToken, 
  validate(taskSchemas.updateTask), 
  taskController.updateTask
);


/**
 * @swagger
 * /api/v1/tasks/{taskId}/complete:
 *   patch:
 *     summary: Mark task as complete
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task marked as complete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
// Route to mark a task as complete.
router.patch('/:taskId/complete', 
  authenticateToken, 
  validate(taskSchemas.completeTask), 
  taskController.completeTask
);



/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Task deleted successfully
 */
// Route to delete a task.
router.delete('/:taskId', 
  authenticateToken, 
  taskController.deleteTask
);


/**
 * @swagger
 * /api/v1/tasks/{taskId}/notes:
 *   post:
 *     summary: Add a note to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *             example:
 *               content: "Task is almost done, just need to finish the final details"
*/
// Defines routes for managing notes on a task.
// Route to add a note to a task.
router.post('/:taskId/notes',
  authenticateToken,
  validate(taskSchemas.addNote), 
  taskController.addTaskNote
);

module.exports = router;