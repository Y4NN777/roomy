// This file serves as a central hub for all Mongoose models, making them easily accessible throughout the application.

const User = require('./User');
const Group = require('./Group');
const Task = require('./Task');
const Expense = require('./Expense');
const Notification = require('./Notification');

module.exports = {
  User,
  Group,
  Task,
  Expense,
  Notification,
};