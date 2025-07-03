const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/v1/aiController');
const authenticateToken = require('../../middleware/auth');
const { body, query } = require('express-validator');
const validation = require('../../middleware/validation');


// AI input validation middleware
const validateAIInput = [
  body('text')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Text must be between 1 and 2000 characters'),
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('Invalid group ID'),
  validation.handleValidationErrors
];

const validateTaskConfirmation = [
  body('tasks')
    .isArray({ min: 1, max: 10 })
    .withMessage('Tasks must be an array with 1-10 items'),
  body('tasks.*.title')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be 1-200 characters'),
  body('tasks.*.description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Task description must be under 1000 characters'),
  body('tasks.*.category')
    .isIn(['cleaning', 'cooking', 'shopping', 'maintenance', 'bills', 'other'])
    .withMessage('Invalid task category'),
  body('tasks.*.priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid task priority'),
  body('tasks.*.estimatedDuration')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('originalText')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Original text must be under 2000 characters'),
  validation.handleValidationErrors
];

// Main AI endpoints
router.post('/process-voice', validateAIInput, aiController.processVoiceInput);
router.post('/confirm-tasks', validateTaskConfirmation, aiController.confirmAndCreateTasks);

// Utility endpoints
router.get('/status', aiController.getStatus);

// Development/testing endpoints (non-production only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', [
    body('testInput')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Test input must be under 500 characters'),
    validation.handleValidationErrors
  ], aiController.testAI);
}

module.exports = router;