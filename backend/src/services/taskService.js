const Task = require('../models/Task');
const Group = require('../models/Group');
const User = require('../models/User');
const notificationService = require('./notifications/notificationService');
const logger = require('../utils/logger');
const CONSTANTS = require('../utils/constants');
const eventBus = require('../services/notifications/eventBus');
const { EventTypes } = require('../utils/eventTypes');

class TaskService {
  constructor() {
    // Notification service instance
    this.notificationService = null;
  }

  // Lazy-load notification service
  getNotificationService() {
    if (!this.notificationService) {
      this.notificationService = notificationService;
    }
    return this.notificationService;
  }

  // Create a new task and emit notifications
  async createTask(taskData, creatorId) {
    try {
      // Verify group membership
      const group = await Group.findById(taskData.groupId);
      if (!group || !group.isMember(creatorId)) {
        throw new Error('Access denied - not a group member');
      }

      // Check assignee is group member
      if (taskData.assignedTo) {
        if (!group.isMember(taskData.assignedTo)) {
          throw new Error('Cannot assign task to non-group member');
        }
      }

      // Create and save task
      const task = new Task({
        ...taskData,
        createdBy: creatorId,
      });

      await task.save();

      // Populate references
      await task.populate([ 
        { path: 'assignedTo', select: '_id name email profilePicture' },
        { path: 'createdBy', select: 'name email' },
        { path: 'groupId', select: 'name _id'}
      ]);

      // Notify assignee by email if needed
      if (task.assignedTo && task.assignedTo._id.toString() !== creatorId) {
        try {
          await notificationService.notifyTaskAssignment(
            task.assignedTo.email,
            task.assignedTo.name,
            task.title,
            task.createdBy.name,
            task.groupId.name,
            {
              dueDate: task.dueDate,
              priority: task.priority,
              description: task.description,
              estimatedDuration: task.estimatedDuration
            }
          );
        } catch (notificationError) {
          logger.warn('Task assignment email failed:', notificationError);
        }
      }

      // Emit event for new task
      eventBus.safeEmit(EventTypes.TASK_CREATED, {
        task,
        assignedUser: task.assignedTo,
        createdBy: task.createdBy,
        groupId: task.groupId._id,
        groupMembers: group.members,
        timestamp: new Date()
      });

      // Update group statistics
      await this.updateGroupTaskStatistics(taskData.groupId);

      logger.info(`Task created: ${task.title} by user ${creatorId}`);
      return task.toJSON();
    } catch (error) {
      logger.error('Create task error:', error);
      throw error;
    }
  }

  // Update a task
  async updateTask(taskId, updateData, requestingUserId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Store original values
      const originalValues = {
        assignedTo: task.assignedTo?.toString(),
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        _id: task._id.toString(),
        groupId: task.groupId.toString()
      };

      // Verify group membership
      const group = await Group.findById(task.groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }

      const userRole = group.findMember(requestingUserId).role;

      // Check edit permissions
      if (!task.canEdit(requestingUserId, userRole)) {
        throw new Error('Insufficient permissions to edit this task');
      }

      // Check new assignee is group member
      if (updateData.assignedTo && updateData.assignedTo !== task.assignedTo?.toString()) {
        if (!group.isMember(updateData.assignedTo)) {
          throw new Error('Cannot assign task to non-group member');
        }
      }

      const isReassignment = updateData.assignedTo && 
                          updateData.assignedTo !== originalValues.assignedTo;

      // Update task fields
      Object.assign(task, updateData);
      await task.save();

      // Populate references
      await task.populate([
        { path: 'assignedTo', select: 'name email profilePicture' },
        { path: 'createdBy', select: 'name email' },
        { path: 'completedBy', select: 'name email' },
        { path: 'groupId', select: 'name' }
      ]);

      // Get updater user
      const updater = await User.findById(requestingUserId).select('name');

      // Notify users by email if needed
      try {
        if (isReassignment && task.assignedTo) {
          // Notify new assignee
          await notificationService.notifyTaskReassignment({
            newAssigneeEmail: task.assignedTo.email,
            newAssigneeName: task.assignedTo.name,
            taskTitle: task.title,
            reassignedBy: updater.name,
            groupName: task.groupId.name,
            dueDate: task.dueDate,
            priority: task.priority
          });
        } else if (task.assignedTo && requestingUserId !== task.assignedTo._id.toString()) {
          // Notify assignee about update
          const changes = {};
          
          if (updateData.title && updateData.title !== originalValues.title) {
            changes.title = { old: originalValues.title, new: updateData.title };
          }
          if (updateData.dueDate && updateData.dueDate !== originalValues.dueDate) {
            changes.dueDate = { 
              old: originalValues.dueDate ? new Date(originalValues.dueDate).toLocaleDateString() : 'None',
              new: new Date(updateData.dueDate).toLocaleDateString()
            };
          }
          if (updateData.priority && updateData.priority !== originalValues.priority) {
            changes.priority = { old: originalValues.priority, new: updateData.priority };
          }

          if (Object.keys(changes).length > 0) {
            await notificationService.notifyTaskUpdate({
              assigneeEmail: task.assignedTo.email,
              assigneeName: task.assignedTo.name,
              taskTitle: task.title,
              updatedBy: updater.name,
              groupName: task.groupId.name,
              changes
            });
          }
        }
      } catch (notificationError) {
        logger.warn('Task update email failed:', notificationError);
      }

      // Emit event for task update
      eventBus.safeEmit(EventTypes.TASK_UPDATED, {
        originalTask: originalValues,
        updatedTask: task,
        updatedBy: requestingUserId,
        updater: updater,
        isReassignment,
        changes: updateData,
        groupId: task.groupId._id,
        timestamp: new Date()
      });

      logger.info(`Task updated: ${task.title} by user ${requestingUserId}`);
      return task.toJSON();
    } catch (error) {
      logger.error('Update task error:', error);
      throw error;
    }
  }

  // Complete a task
  async completeTask(taskId, requestingUserId, actualDuration = null) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Verify group membership
      const group = await Group.findById(task.groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }

      const userRole = group.findMember(requestingUserId).role;

      // Check complete permissions
      if (!task.canComplete(requestingUserId, userRole)) {
        throw new Error('Insufficient permissions to complete this task');
      }

      // Update task as completed
      task.markCompleted(requestingUserId);
      if (actualDuration) {
        task.actualDuration = actualDuration;
      }
      
      await task.save();

      // Populate references
      await task.populate([
        { path: 'assignedTo', select: 'name email profilePicture' },
        { path: 'createdBy', select: 'name email' },
        { path: 'completedBy', select: 'name email' },
        { path: 'groupId', select: 'name' }
      ]);

      // Notify users by email if needed
      if (task.createdBy._id.toString() !== requestingUserId) {
        try {
          await notificationService.notifyTaskCompletion({
            creatorEmail: task.createdBy.email,
            creatorName: task.createdBy.name,
            taskTitle: task.title,
            completedBy: task.completedBy.name,
            groupName: task.groupId.name,
            actualDuration
          });
        } catch (notificationError) {
          logger.warn('❌ Task completion email failed:', notificationError);
        }
      }

      // 📱 EVENT EMISSION for in-app + WebSocket
      eventBus.safeEmit(EventTypes.TASK_COMPLETED, {
        task,
        completedBy: task.completedBy,
        groupId: task.groupId._id,
        groupMembers: group.members,
        actualDuration,
        timestamp: new Date()
      });

      // Update group statistics
      await this.updateGroupTaskStatistics(task.groupId);

      logger.info(`Task completed: ${task.title} by user ${requestingUserId}`);
      return task.toJSON();
    } catch (error) {
      logger.error('Complete task error:', error);
      throw error;
    }
  }

  // Delete a task
  async deleteTask(taskId, requestingUserId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Verify group membership
      const group = await Group.findById(task.groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }

      const userRole = group.findMember(requestingUserId).role;

      // Check delete permissions
      if (userRole !== CONSTANTS.USER_ROLES.ADMIN && 
          task.createdBy.toString() !== requestingUserId) {
        throw new Error('Insufficient permissions to delete this task');
      }

      // Store task data
      const taskData = {
        _id: task._id,
        title: task.title,
        description: task.description,
        groupId: task.groupId,
        createdBy: task.createdBy
      };

      await Task.findByIdAndDelete(taskId);

      // Emit event for task deletion
      eventBus.safeEmit(EventTypes.TASK_DELETED, {
        task: taskData,
        deletedBy: requestingUserId,
        groupId: task.groupId,
        timestamp: new Date()
      });

      // Update group statistics
      await this.updateGroupTaskStatistics(task.groupId);

      logger.info(`Task deleted: ${task.title} by user ${requestingUserId}`);
      return { message: 'Task deleted successfully' };
    } catch (error) {
      logger.error('Delete task error:', error);
      throw error;
    }
  }

  // Get all tasks for a group
  async getTasks(groupId, filters = {}, requestingUserId) {
    try {
      // Verify group membership
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }

      const tasks = await Task.getGroupTasks(groupId, filters);
      
      return {
        tasks: tasks.map(task => task.toJSON()),
        total: tasks.length,
        filters: filters,
      };
    } catch (error) {
      logger.error('Get tasks error:', error);
      throw error;
    }
  }

  // Get a single task
  async getTask(taskId, requestingUserId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email profilePicture')
        .populate('createdBy', 'name email')
        .populate('completedBy', 'name email')
        .populate('groupId', 'name')
        .populate('notes.author', 'name email profilePicture');

      if (!task) {
        throw new Error('Task not found');
      }

      // Verify group membership
      const group = await Group.findById(task.groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }

      return task.toJSON();
    } catch (error) {
      logger.error('Get task error:', error);
      throw error;
    }
  }

  // Add a note to a task
  async addTaskNote(taskId, content, authorId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Verify group membership
      const group = await Group.findById(task.groupId);
      if (!group || !group.isMember(authorId)) {
        throw new Error('Access denied - not a group member');
      }

      // Add note
      task.addNote(content, authorId);
      await task.save();

      // Populate note author
      await task.populate('notes.author', 'name email profilePicture');

      logger.info(`Note added to task ${taskId} by user ${authorId}`);
      return task.notes[task.notes.length - 1];
    } catch (error) {
      logger.error('Add task note error:', error);
      throw error;
    }
  }

  // Get all tasks for a user
  async getUserTasks(userId, status = null) {
    try {
      const tasks = await Task.getUserTasks(userId, status);
      return tasks.map(task => task.toJSON());
    } catch (error) {
      logger.error('Get user tasks error:', error);
      throw error;
    }
  }

  // Get statistics for a group
  async getTaskStatistics(groupId, requestingUserId) {
    try {
      // Verify group membership
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(requestingUserId)) {
        throw new Error('Access denied - not a group member');
      }

      const stats = await Task.aggregate([
        { $match: { groupId: groupId } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            pendingTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
            },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'completed'] },
                      { $lt: ['$dueDate', new Date()] },
                      { $ne: ['$dueDate', null] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
          }
        }
      ]);

      const result = stats[0] || {
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
      };

      // Calculate completion rate
      result.completionRate = result.totalTasks > 0 
        ? (result.completedTasks / result.totalTasks * 100).toFixed(1)
        : 0;

      return result;
    } catch (error) {
      logger.error('Get task statistics error:', error);
      throw error;
    }
  }

  // Update group statistics cache
  async updateGroupTaskStatistics(groupId) {
    try {
      const group = await Group.findById(groupId);
      if (group) {
        await group.updateStatistics();
      }
    } catch (error) {
      logger.error('Update group task statistics error:', error);
    }
  }
}

module.exports = new TaskService();