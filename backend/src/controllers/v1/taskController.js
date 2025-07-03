const taskService = require('../../services/taskService');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../utils/logger');

class TaskController {
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body, req.user.id);


      if (task.description && task.description.length > 20 && aiService.isAvailable()) {
        try {
          const groupContext = await this.getGroupContext(task.groupId, req.user.id);
          const suggestions = await aiService.processVoiceToTasks(
            `Related to: ${task.title} - ${task.description}`, 
            groupContext
          );
          
          // Include suggestions in response (limited to 3)
          const limitedSuggestions = suggestions.suggestedTasks.slice(0, 3);
          
          return responseHelper.success(res, {
            task,
            aiSuggestions: limitedSuggestions.length > 0 ? limitedSuggestions : undefined
          }, 'Task created successfully');
        } catch (aiError) {
          console.log('AI suggestions failed, continuing without them:', aiError.message);
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


  async getGroupContext(groupId, userId) {
    try {
      const [groupMembers, recentTasks] = await Promise.all([
        // Your existing method to get group members
        Group.findById(groupId).populate('members.userId', 'name'),
        // Your existing method to get recent tasks
        Task.find({ groupId }).sort({ createdAt: -1 }).limit(10)
      ]);
      
      return {
        groupMembers: groupMembers.members.map(member => ({
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
      return { groupMembers: [], recentTasks: [] };
    }
  }


  async getTasks(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        assignedTo: req.query.assignedTo,
        category: req.query.category,
        priority: req.query.priority,
      };

      // Remove undefined filters
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