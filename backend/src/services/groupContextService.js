// Provides group context (members and recent tasks) for AI and task-related features.
const groupService = require('./groupService');
const Task = require('../models/Task');

// Get group members (with details) and recent tasks for a group.
async function getGroupContext(groupId, requestingUserId, recentTaskLimit = 10) {
  const groupMembers = await groupService.getGroupMembers(groupId, requestingUserId, true);
  const tasks = await Task.getGroupTasks(groupId, {});
  const recentTasks = tasks
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, recentTaskLimit)
    .map(task => task.toJSON());
  return { groupMembers, recentTasks };
}

module.exports = { getGroupContext };