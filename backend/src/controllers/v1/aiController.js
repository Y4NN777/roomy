const aiService = require('../../services/aiService');
const taskService = require('../../services/taskService');
const groupService = require('../../services/groupService');
const responseHelper = require('../../utils/responseHelper');

class AIController {
  
  // Main endpoint: Process voice/text input
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
      
      // Get group context for better AI processing
      const groupContext = await this.getGroupContext(userGroupId, userId);
      
      // Process with AI
      const result = await aiService.processVoiceToTasks(text, groupContext);
      
      // Log for monitoring
      console.log(`🤖 AI processed input for user ${userId}: ${result.suggestedTasks.length} tasks generated`);
      
      responseHelper.success(res, {
        ...result,
        groupContext: {
          groupId: userGroupId,
          memberCount: groupContext.groupMembers.length,
          recentTaskCount: groupContext.recentTasks.length
        }
      }, 'Voice input processed successfully');
      
    } catch (error) {
      console.error('❌ AI processing error:', error);
      
      if (error.message.includes('AI service is not available')) {
        return responseHelper.error(res, 'AI service is currently unavailable', 503);
      }
      
      responseHelper.error(res, 'Failed to process voice input', 500);
    }
  }
  
  // Confirm and create AI-suggested tasks
  async confirmTasks(req, res) {
    try {
      const { tasks, originalText } = req.body;
      const userId = req.user.id;
      const userGroupId = req.user.groupId;
      
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return responseHelper.error(res, 'Tasks array is required', 400);
      }
      
      if (tasks.length > 10) {
        return responseHelper.error(res, 'Maximum 10 tasks can be created at once', 400);
      }
      
      if (!userGroupId) {
        return responseHelper.error(res, 'User must be in a group to create tasks', 400);
      }
      
      const createdTasks = [];
      const errors = [];
      
      // Create each confirmed task
      for (const [index, taskData] of tasks.entries()) {
        try {
          // Validate and prepare task data
          const taskToCreate = {
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category || 'other',
            priority: taskData.priority || 'medium',
            assignedTo: taskData.suggestedAssignee || null,
            dueDate: taskData.suggestedDueDate || null,
            estimatedDuration: taskData.estimatedDuration || 30,
            groupId: userGroupId,
            createdBy: userId,
            aiGenerated: true,
            originalVoiceInput: originalText,
            aiConfidence: taskData.assignmentConfidence || 0.5,
            notes: taskData.notes || ''
          };
          
          const createdTask = await taskService.createTask(taskToCreate);
          createdTasks.push(createdTask);
          
          console.log(`✅ Created AI task: "${createdTask.title}" ${createdTask.assignedTo ? `→ ${createdTask.assignedTo}` : '(unassigned)'}`);
          
        } catch (error) {
          console.error(`❌ Failed to create task ${index + 1}:`, error);
          errors.push({
            taskIndex: index + 1,
            taskTitle: taskData.title,
            error: error.message
          });
        }
      }
      
      responseHelper.success(res, {
        createdTasks: createdTasks.map(task => ({
          id: task._id,
          title: task.title,
          assignedTo: task.assignedTo,
          category: task.category,
          priority: task.priority,
          aiGenerated: true
        })),
        summary: {
          successCount: createdTasks.length,
          errorCount: errors.length,
          totalRequested: tasks.length
        },
        errors: errors.length > 0 ? errors : undefined
      }, `Successfully created ${createdTasks.length} of ${tasks.length} tasks`);
      
    } catch (error) {
      console.error('❌ Task confirmation error:', error);
      responseHelper.error(res, 'Failed to create tasks', 500);
    }
  }
  
  // Test AI service (for development/debugging)
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
      
      // Test connection first
      const connectionTest = await aiService.testConnection();
      if (!connectionTest.connected) {
        return responseHelper.error(res, `AI connection failed: ${connectionTest.error}`, 503);
      }
      
      // If test input provided, process it
      let result = null;
      if (testInput && userGroupId) {
        const groupContext = await this.getGroupContext(userGroupId, userId);
        result = await aiService.processVoiceToTasks(testInput, groupContext);
      }
      
      responseHelper.success(res, {
        aiStatus: 'available',
        connection: connectionTest,
        testResult: result,
        timestamp: new Date().toISOString()
      }, 'AI service test completed');
      
    } catch (error) {
      console.error('❌ AI test error:', error);
      responseHelper.error(res, `AI test failed: ${error.message}`, 500);
    }
  }
  
  // Get AI service status
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
      console.error('❌ Error getting AI status:', error);
      responseHelper.error(res, 'Failed to get AI status', 500);
    }
  }
  
  // Helper: Get group context for AI processing
  async getGroupContext(groupId, userId) {
    try {
      const [groupMembers, recentTasks] = await Promise.all([
        groupService.getGroupMembers(groupId),
        taskService.getGroupTasks(groupId, { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);
      
      return {
        groupMembers: groupMembers.map(member => ({
          id: member.userId._id,
          name: member.userId.name,
          role: member.role
        })),
        recentTasks: recentTasks.map(task => ({
          title: task.title,
          category: task.category,
          status: task.status
        }))
      };
    } catch (error) {
      console.error('❌ Error getting group context:', error);
      return { groupMembers: [], recentTasks: [] };
    }
  }
}

module.exports = new AIController();