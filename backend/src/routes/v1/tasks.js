const express = require('express');
const taskController = require('../../controllers/v1/taskController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyGroupMembership } = require('../../middleware/groupPermissions');
const { validate, taskSchemas } = require('../../middleware/validation');

const router = express.Router();

// User's personal task routes
router.get('/my-tasks', 
  authenticateToken, 
  taskController.getUserTasks
);

// Group task routes (require group membership)
router.post('/', 
  authenticateToken, 
  validate(taskSchemas.createTask), 
  taskController.createTask
);

router.get('/group/:groupId', 
  authenticateToken, 
  verifyGroupMembership, 
  taskController.getTasks
);

router.get('/group/:groupId/statistics', 
  authenticateToken, 
  verifyGroupMembership, 
  taskController.getTaskStatistics
);

// Individual task routes
router.get('/:taskId', 
  authenticateToken, 
  taskController.getTask
);

router.patch('/:taskId', 
  authenticateToken, 
  validate(taskSchemas.updateTask), 
  taskController.updateTask
);

router.patch('/:taskId/complete', 
  authenticateToken, 
  validate(taskSchemas.completeTask), 
  taskController.completeTask
);

router.delete('/:taskId', 
  authenticateToken, 
  taskController.deleteTask
);

// Task notes
router.post('/:taskId/notes', 
  authenticateToken, 
  validate(taskSchemas.addNote), 
  taskController.addTaskNote
);

module.exports = router;