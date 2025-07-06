const express = require('express');
const taskController = require('../../controllers/v1/taskController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership } = require('../../middleware/groupPermissions');
const { validate, taskSchemas } = require('../../middleware/validation');

const router = express.Router();

// Defines routes for managing a user's personal tasks.
// Route to get all tasks assigned to the current user across all groups.
router.get('/my-tasks', 
  authenticateToken, 
  taskController.getUserTasks
);

// Defines routes for managing tasks within a specific group.
// Route to create a new task in a group.
router.post('/', 
  authenticateToken, 
  validate(taskSchemas.createTask), 
  taskController.createTask
);

// Route to get all tasks for a specific group.
router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  taskController.getTasks
);

// Route to get task statistics for a specific group.
router.get('/group/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  taskController.getTaskStatistics
);

// Defines routes for managing individual tasks.
// Route to get a single task by its ID.
router.get('/:taskId', 
  authenticateToken, 
  taskController.getTask
);

// Route to update an existing task.
router.patch('/:taskId', 
  authenticateToken, 
  validate(taskSchemas.updateTask), 
  taskController.updateTask
);

// Route to mark a task as complete.
router.patch('/:taskId/complete', 
  authenticateToken, 
  validate(taskSchemas.completeTask), 
  taskController.completeTask
);

// Route to delete a task.
router.delete('/:taskId', 
  authenticateToken, 
  taskController.deleteTask
);

// Defines routes for managing notes on a task.
// Route to add a note to a task.
router.post('/:taskId/notes', 
  authenticateToken, 
  validate(taskSchemas.addNote), 
  taskController.addTaskNote
);

module.exports = router;