const aiService = require('../../services/aiService');
const taskService = require('../../services/taskService');
const groupService = require('../../services/groupService');
const responseHelper = require('../../utils/responseHelper');
const eventBus = require('../../utils/eventBus')
const eventTypes = require('../../utils/eventTypes')
const groupContextService = require('../../services/groupContextService');

class AIController {
  
  // Processes voice or text input to generate task suggestions using the AI service.
  async processVoiceInput(req, res) {
    try {
      const { text, groupId } = req.body;
      const userId = req.user.id;
      const userGroupId = groupId || req.user.groupId;
      
      if (!text || text.trim().length === 0) {
        return responseHelper.error(res, 'Text input is required', 400);
      }
      
      if (!userGroupId) {
        return responseHelper.error(res, 'User must be in a group to use AI features', 400);
      }
      
      // Retrieves contextual information about the group to improve the accuracy of AI processing.
      const groupContext = await groupContextService.getGroupContext(userGroupId, userId);
      
      // Sends the input text and group context to the AI service for processing.
      const result = await aiService.processVoiceToTasks(text, groupContext);
      
      
      
      responseHelper.success(res, {
        ...result,
        groupContext: {
          groupId: userGroupId,
          memberCount: groupContext.groupMembers.length,
          recentTaskCount: groupContext.recentTasks.length
        }
      }, 'Voice input processed successfully');
      
    } catch (error) {
      console.error('AI processing error:', error);
      
      if (error.message.includes('AI service is not available')) {
        return responseHelper.error(res, 'AI service is currently unavailable', 503);
      }
      
      responseHelper.error(res, 'Failed to process voice input', 500);
    }
  }
  
  // Confirms and creates tasks based on AI suggestions and emits an event upon completion.
  async confirmAndCreateTasks(tasks, context = {}) {
    const { userId, groupId, originalText } = context;
    
    try {
      // TODO: The 'createTasksInSystem' method is not defined in this class.
      // Creates the tasks in the system using the dedicated task service.
      const createdTasks = await this.createTasksInSystem(tasks, context);
      
      // Emits an event to notify other parts of the system that AI-generated tasks have been confirmed.
      eventBus.safeEmit(EventTypes.AI_TASKS_CONFIRMED, {
        userId,
        groupId,
        tasks: createdTasks,
        originalText,
        timestamp: new Date()
      });
      
      return createdTasks;
      
    } catch (error) {
      console.error('Task creation error:', error);
      throw error;
    }
  }
  
  // Provides a test endpoint for verifying the AI service's availability and processing capabilities.
  async testAI(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return responseHelper.error(res, 'AI testing not available in production', 403);
      }
      
      const { testInput } = req.body;
      const userId = req.user.id;
      const userGroupId = req.user.groupId;
      
      if (!aiService.isAvailable()) {
        return responseHelper.error(res, 'AI service is not available', 503);
      }
      
      // First, tests the connection to the AI service to ensure it is responsive.
      const connectionTest = await aiService.testConnection();
      if (!connectionTest.connected) {
        return responseHelper.error(res, `AI connection failed: ${connectionTest.error}`, 503);
      }
      
      // If test input is provided in the request, it is processed using the AI service.
      let result = null;
      if (testInput && userGroupId) {
        const groupContext = await groupContextService.getGroupContext(userGroupId, userId);
        result = await aiService.processVoiceToTasks(testInput, groupContext);
      }
      
      responseHelper.success(res, {
        aiStatus: 'available',
        connection: connectionTest,
        testResult: result,
        timestamp: new Date().toISOString()
      }, 'AI service test completed');
      
    } catch (error) {
      console.error('AI test error:', error);
      responseHelper.error(res, `AI test failed: ${error.message}`, 500);
    }
  }
  
  // Retrieves the current operational status and capabilities of the AI service.
  async getStatus(req, res) {
    try {
      const status = {
        available: aiService.isAvailable(),
        model: 'gemini-2.0-flash-exp',
        features: {
          taskExtraction: true,
          assignmentDetection: true,
          categoryClassification: true,
          priorityDetection: true,
          fallbackSupport: true
        },
        timestamp: new Date().toISOString()
      };
      
      if (aiService.isAvailable()) {
        const connectionTest = await aiService.testConnection();
        status.connection = connectionTest;
      }
      
      responseHelper.success(res, status, 'AI service status retrieved');
      
    } catch (error) {
      console.error('Error getting AI status:', error);
      responseHelper.error(res, 'Failed to get AI status', 500);
    }
  }

}

module.exports = new AIController();