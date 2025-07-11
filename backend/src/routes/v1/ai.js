const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/v1/aiController');
const {authenticateToken} = require('../../middleware/auth');
const { body, query } = require('express-validator');
const validation = require('../../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     AIProcessRequest:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Text or voice input to process
 *         groupId:
 *           type: string
 *           description: Optional group ID for context
 *       example:
 *         text: "We need to clean the kitchen and buy groceries for dinner"
 *         groupId: "64abc123def456789"
 *     
 *     AIProcessResponse:
 *       type: object
 *       properties:
 *         suggestedTasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SuggestedTask'
 *         confidence:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *         originalText:
 *           type: string
 *         processingTime:
 *           type: number
 *           description: Processing time in milliseconds
 *     
 *     SuggestedTask:
 *       type: object
 *       properties:
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
 *         estimatedDuration:
 *           type: integer
 *           description: Duration in minutes
 *         confidence:
 *           type: number
 *           format: float
 *       example:
 *         title: "Clean the kitchen"
 *         description: "Deep clean kitchen surfaces and appliances"
 *         category: "cleaning"
 *         priority: "medium"
 *         estimatedDuration: 45
 *         confidence: 0.95
 *     
 *     ConfirmTasksRequest:
 *       type: object
 *       required:
 *         - tasks
 *       properties:
 *         tasks:
 *           type: array
 *           minItems: 1
 *           maxItems: 10
 *           items:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               category:
 *                 type: string
 *                 enum: [cleaning, cooking, shopping, maintenance, bills, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               estimatedDuration:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 480
 *         groupId:
 *           type: string
 *         originalText:
 *           type: string
 *           maxLength: 2000
 *       example:
 *         tasks:
 *           - title: "Clean the kitchen"
 *             description: "Deep clean all surfaces"
 *             category: "cleaning"
 *             priority: "medium"
 *             estimatedDuration: 45
 *         groupId: "64abc123def456789"
 *         originalText: "We need to clean the kitchen"
 *     
 *     AIStatusResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [online, offline, degraded]
 *         version:
 *           type: string
 *         capabilities:
 *           type: array
 *           items:
 *             type: string
 *         lastHealthCheck:
 *           type: string
 *           format: date-time
 *         responseTime:
 *           type: number
 *           description: Average response time in milliseconds
 *       example:
 *         status: "online"
 *         version: "1.2.0"
 *         capabilities: ["text_processing", "task_suggestion", "natural_language"]
 *         lastHealthCheck: "2023-01-15T10:30:00Z"
 *         responseTime: 125.5
 * 
 * tags:
 *   - name: AI
 *     description: AI-powered task processing and suggestions
 */

// Defines validation rules for AI input, ensuring that the text is within a reasonable length and the group ID is valid.
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

// Defines validation rules for confirming AI-suggested tasks, ensuring the data structure is correct.
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

/**
 * @swagger
 * /api/v1/ai/process-voice:
 *   post:
 *     summary: Process voice or text input to suggest tasks
 *     description: Analyzes natural language input (voice or text) and returns AI-generated task suggestions based on the content. The AI will identify actionable items and categorize them appropriately.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIProcessRequest'
 *     responses:
 *       200:
 *         description: AI processing completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIProcessResponse'
 *       400:
 *         description: Invalid input - text too long, missing required fields, or invalid group ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded - too many AI requests in a short time
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: AI service temporarily unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Defines the main AI endpoint for processing voice or text input.
router.post('/process-voice', authenticateToken, ...validateAIInput, aiController.processVoiceInput);

/**
 * @swagger
 * /api/v1/ai/confirm-tasks:
 *   post:
 *     summary: Confirm and create tasks from AI suggestions
 *     description: Takes the AI-suggested tasks (potentially modified by the user) and creates them as actual tasks in the specified group. This endpoint validates the task data and creates the tasks in the database.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmTasksRequest'
 *     responses:
 *       201:
 *         description: Tasks created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 createdTasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 totalCreated:
 *                   type: integer
 *               example:
 *                 message: "3 tasks created successfully"
 *                 totalCreated: 3
 *                 createdTasks: []
 *       400:
 *         description: Invalid task data - validation errors in task properties
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user doesn't have permission to create tasks in the specified group
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
// Defines the endpoint for confirming and creating tasks from AI suggestions.
router.post('/confirm-tasks', authenticateToken, ...validateTaskConfirmation, aiController.handleConfirmAndCreateTasks);

/**
 * @swagger
 * /api/v1/ai/status:
 *   get:
 *     summary: Get AI service status
 *     description: Returns the current status and health information of the AI service, including version, capabilities, and performance metrics.
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: AI service status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIStatusResponse'
 *       503:
 *         description: AI service is currently unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "offline"
 *                 message:
 *                   type: string
 *                   example: "AI service is currently offline for maintenance"
 */
// Defines a utility endpoint to get the current status of the AI service.
router.get('/status', aiController.getStatus);

/**
 * @swagger
 * /api/v1/ai/test:
 *   post:
 *     summary: Test AI service (Development only)
 *     description: Development endpoint for testing AI functionality with custom input. Only available in non-production environments.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testInput:
 *                 type: string
 *                 maxLength: 500
 *                 description: Custom test input for AI processing
 *                 default: "Test AI processing"
 *             example:
 *               testInput: "Clean the house and buy groceries for dinner tonight"
 *     responses:
 *       200:
 *         description: AI test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 testResult:
 *                   type: object
 *                   description: AI processing results for the test input
 *                 processingTime:
 *                   type: number
 *                   description: Time taken to process the test in milliseconds
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *               example:
 *                 message: "AI test completed successfully"
 *                 testResult: 
 *                   suggestedTasks: []
 *                   confidence: 0.85
 *                 processingTime: 150.5
 *                 timestamp: "2023-01-15T10:30:00Z"
 *       400:
 *         description: Invalid test input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Endpoint not available in production
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test endpoint not available in production environment"
 */
// Defines a development-only endpoint for testing the AI service.
// This route is available only in non-production environments for testing purposes.
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', [
    body('testInput')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Test input must be under 500 characters'),
    validation.handleValidationErrors
  ], authenticateToken, aiController.testAI);
}

module.exports = router;