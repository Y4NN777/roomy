const taskService = require('../../services/taskService');
const aiService = require('../../services/aiService');
const Group = require('../../models/Group');
const Task = require('../../models/Task');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../utils/logger');
const groupContextService = require('../../services/groupContextService');

// A controller for managing tasks, including creation, assignment, and completion.
class TaskController {
    // Creates a new task and, if applicable, provides AI-generated suggestions for related tasks.
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body, req.user.id);


      if (task.description && task.description.length > 20 && aiService.isAvailable()) {
        try {
          const groupContext = await groupContextService.getGroupContext(task.groupId, req.user.id);
          const suggestions = await aiService.processVoiceToTasks(
            `Related to: ${task.title} - ${task.description}`, 
            groupContext
          );
          
          // Includes up to 3 AI-generated task suggestions in the response.
          const limitedSuggestions = suggestions.suggestedTasks.slice(0, 3);
          
          return responseHelper.success(res, {
            task,
            aiSuggestions: limitedSuggestions.length > 0 ? limitedSuggestions : undefined
          }, 'Task created successfully');
        } catch (aiError) {
          // If AI suggestions fail, log the error and continue without them.
          logger.warn('AI suggestions failed, but the task was created successfully.', { error: aiError.message });
        }
      }
      
      responseHelper.success(
        res,
        'Task created successfully',
        { task },
        201
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      if (error.message === 'Cannot assign task to non-group member') {
        return responseHelper.error(res, error.message, 400, 'INVALID_ASSIGNEE');
      }
      next(error);
    }
  }


  // Retrieves a list of tasks for the current group, with optional filters.
  async getTasks(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        assignedTo: req.query.assignedTo,
        category: req.query.category,
        priority: req.query.priority,
      };

      // Removes any undefined filter values to prevent issues with the database query.
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await taskService.getTasks(req.group._id, filters, req.user.id);
      
      responseHelper.success(
        res,
        'Tasks retrieved successfully',
        result
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Retrieves a single task by its ID.
  async getTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await taskService.getTask(taskId, req.user.id);
      
      responseHelper.success(
        res,
        'Task retrieved successfully',
        { task }
      );
    } catch (error) {
      if (error.message === 'Task not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Updates an existing task.
  async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await taskService.updateTask(taskId, req.body, req.user.id);
      
      responseHelper.success(
        res,
        'Task updated successfully',
        { task }
      );
    } catch (error) {
      if (error.message === 'Task not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissions')) {
        return responseHelper.forbidden(res, error.message);
      }
      if (error.message === 'Cannot assign task to non-group member') {
        return responseHelper.error(res, error.message, 400, 'INVALID_ASSIGNEE');
      }
      next(error);
    }
  }

    // Marks a task as complete and records its actual duration.
  async completeTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { actualDuration } = req.body;
      
      const task = await taskService.completeTask(taskId, req.user.id, actualDuration);
      
      responseHelper.success(
        res,
        'Task completed successfully',
        { task }
      );
    } catch (error) {
      if (error.message === 'Task not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissions')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Deletes a task.
  async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const result = await taskService.deleteTask(taskId, req.user.id);
      
      responseHelper.success(
        res,
        result.message
      );
    } catch (error) {
      if (error.message === 'Task not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissions')) {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Adds a note to a specific task.
  async addTaskNote(req, res, next) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      
      const note = await taskService.addTaskNote(taskId, content, req.user.id);
      
      responseHelper.success(
        res,
        'Note added successfully',
        { note }
      );
    } catch (error) {
      if (error.message === 'Task not found') {
        return responseHelper.notFound(res, error.message);
      }
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }

    // Retrieves all tasks assigned to the currently authenticated user.
  async getUserTasks(req, res, next) {
    try {
      const { status } = req.query;
      const tasks = await taskService.getUserTasks(req.user.id, status);
      
      responseHelper.success(
        res,
        'User tasks retrieved successfully',
        { tasks }
      );
    } catch (error) {
      next(error);
    }
  }

    // Retrieves statistics for tasks within the current group.
  async getTaskStatistics(req, res, next) {
    try {
      const statistics = await taskService.getTaskStatistics(req.group._id, req.user.id);
      
      responseHelper.success(
        res,
        'Task statistics retrieved successfully',
        { statistics }
      );
    } catch (error) {
      if (error.message === 'Access denied - not a group member') {
        return responseHelper.forbidden(res, error.message);
      }
      next(error);
    }
  }
}

module.exports = new TaskController();