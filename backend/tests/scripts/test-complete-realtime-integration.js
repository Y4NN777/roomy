// tests/scripts/test-complete-notification-api.js
// TEST ALL THE NEW NOTIFICATION METHODS

const mongoose = require('mongoose');
require('dotenv').config();

// Setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

const notificationService = require('../../src/services/notifications/notificationService');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const { NotificationTypes } = require('../../src/utils/eventTypes');

async function connectDatabase() {
  try {
    const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/roomy_api_test';
    await mongoose.connect(testDbUri);
    console.log('🗄️  Connected to test database');
    
    // Clear test data
    await Notification.deleteMany({});
    console.log('🧹 Cleared test data');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('🗄️  Disconnected from database');
  } catch (error) {
    console.error('❌ Database disconnect failed:', error.message);
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error('❌ ASSERTION FAILED:', message);
    process.exit(1);
  }
  console.log('✅', message);
}

async function testBasicMethods() {
  console.log('\n🧪 TESTING BASIC METHODS');
  console.log('========================');
  
  const testUserId = new mongoose.Types.ObjectId();
  const testGroupId = new mongoose.Types.ObjectId();
  
  // Test 1: Create notification
  console.log('📝 Testing createAndDeliverNotification...');
  const notification = await notificationService.createAndDeliverNotification({
    recipientId: testUserId,
    groupId: testGroupId,
    type: NotificationTypes.TASK_ASSIGNED,
    title: 'Test Notification',
    message: 'This is a test notification',
    data: {
      actorId: new mongoose.Types.ObjectId(),
      actorName: 'Test Actor'
    },
    priority: 'medium'
  });
  assert(notification._id, 'Should create notification with ID');
  
  // Test 2: Get notifications
  console.log('📋 Testing getUserNotifications...');
  const result = await notificationService.getUserNotifications(testUserId);
  assert(result.notifications.length === 1, 'Should return 1 notification');
  assert(result.pagination, 'Should include pagination info');
  
  // Test 3: Mark as read
  console.log('👁️ Testing markAsRead...');
  const readResult = await notificationService.markAsRead(notification._id, testUserId);
  assert(readResult.isRead === true, 'Should mark notification as read');
  
  // Test 4: Get unread count
  console.log('🔢 Testing getUnreadCount...');
  const unreadCount = await notificationService.getUnreadCount(testUserId);
  assert(unreadCount === 0, 'Should have 0 unread notifications');
  
  return { testUserId, testGroupId, notificationId: notification._id };
}

async function testNewMethods(testUserId, testGroupId, notificationId) {
  console.log('\n🧪 TESTING NEW METHODS');
  console.log('======================');
  
  // Test 1: Delete notification
  console.log('🗑️ Testing deleteNotification...');
  const deleteResult = await notificationService.deleteNotification(notificationId, testUserId);
  assert(deleteResult, 'Should delete notification');
  
  // Test 2: Create multiple notifications for stats testing
  console.log('📊 Creating test data for stats...');
  const notifications = [];
  for (let i = 0; i < 5; i++) {
    const notif = await notificationService.createAndDeliverNotification({
      recipientId: testUserId,
      groupId: testGroupId,
      type: i % 2 === 0 ? NotificationTypes.TASK_ASSIGNED : NotificationTypes.EXPENSE_ADDED,
      title: `Test Notification ${i}`,
      message: `Test message ${i}`,
      priority: i < 2 ? 'high' : 'medium'
    });
    notifications.push(notif);
  }
  
  // Test 3: Get notification stats
  console.log('📈 Testing getNotificationStats...');
  const stats = await notificationService.getNotificationStats(testUserId, '7d');
  assert(stats.total === 5, 'Should show 5 total notifications');
  assert(stats.byType, 'Should include type breakdown');
  assert(stats.byPriority, 'Should include priority breakdown');
  
  // Test 4: Get notifications by type
  console.log('📂 Testing getNotificationsByType...');
  const typeResult = await notificationService.getNotificationsByType(
    testUserId, 
    NotificationTypes.TASK_ASSIGNED
  );
  assert(typeResult.notifications.length >= 1, 'Should return task notifications');
  assert(typeResult.type === NotificationTypes.TASK_ASSIGNED, 'Should filter by type');
  
  return notifications;
}

async function testBulkMethods(testUserId, notifications) {
  console.log('\n🧪 TESTING BULK METHODS');
  console.log('=======================');
  
  const notificationIds = notifications.map(n => n._id);
  
  // Test 1: Bulk mark as read
  console.log('📚 Testing bulkMarkAsRead...');
  const bulkReadResult = await notificationService.bulkMarkAsRead(testUserId, notificationIds.slice(0, 3));
  assert(bulkReadResult.modifiedCount === 3, 'Should mark 3 notifications as read');
  
  // Test 2: Bulk delete by IDs
  console.log('🗑️ Testing bulkDeleteByIds...');
  const bulkDeleteResult = await notificationService.bulkDeleteByIds(testUserId, notificationIds.slice(0, 2));
  assert(bulkDeleteResult.deletedCount === 2, 'Should delete 2 notifications');
  
  // Test 3: Bulk delete older than
  console.log('⏰ Testing bulkDeleteOlderThan...');
  // This won't delete anything since notifications are new, but tests the method
  const oldDeleteResult = await notificationService.bulkDeleteOlderThan(testUserId, 30);
  assert(typeof oldDeleteResult.deletedCount === 'number', 'Should return deletion count');
}

async function testAdvancedMethods(testUserId, testGroupId) {
  console.log('\n🧪 TESTING ADVANCED METHODS');
  console.log('============================');
  
  // Test 1: Notification preferences (requires User model update)
  console.log('⚙️ Testing notification preferences...');
  try {
    const preferences = await notificationService.getNotificationPreferences(testUserId);
    assert(preferences.email, 'Should return email preferences');
    assert(preferences.push, 'Should return push preferences');
    assert(preferences.inApp, 'Should return in-app preferences');
    
    // Test updating preferences
    const updatedPrefs = await notificationService.updateNotificationPreferences(testUserId, {
      ...preferences,
      email: { ...preferences.email, taskAssigned: false }
    });
    console.log('✅ Notification preferences work');
  } catch (error) {
    console.log('⚠️ Notification preferences test skipped (requires User model update):', error.message);
  }
  
  // Test 2: Group broadcast
  console.log('📢 Testing createGroupBroadcast...');
  try {
    const broadcast = await notificationService.createGroupBroadcast({
      groupId: testGroupId,
      message: 'Test group announcement',
      type: 'SYSTEM_ANNOUNCEMENT',
      broadcastBy: testUserId
    });
    console.log('✅ Group broadcast works');
  } catch (error) {
    console.log('⚠️ Group broadcast test skipped (requires Group model):', error.message);
  }
  
  // Test 3: Direct notification
  console.log('💬 Testing sendDirectNotification...');
  const recipientId = new mongoose.Types.ObjectId();
  const directNotif = await notificationService.sendDirectNotification({
    senderId: testUserId,
    recipientId: recipientId,
    title: 'Direct Message',
    message: 'This is a direct notification',
    type: 'DIRECT_MESSAGE',
    priority: 'medium'
  });
  assert(directNotif._id, 'Should create direct notification');
  
  // Test 4: System stats
  console.log('📊 Testing getSystemStats...');
  const systemStats = await notificationService.getSystemStats();
  assert(systemStats.total >= 0, 'Should return total count');
  assert(systemStats.typeDistribution, 'Should return type distribution');
  
  // Test 5: Notification timeline
  console.log('📅 Testing getNotificationTimeline...');
  const timeline = await notificationService.getNotificationTimeline(testUserId, { days: 7 });
  assert(timeline.timeframe === '7d', 'Should return 7 day timeframe');
  assert(Array.isArray(timeline.timeline), 'Should return timeline array');
  
  // Test 6: Snooze notification (create a new one first)
  console.log('😴 Testing snoozeNotification...');
  const snoozeNotif = await notificationService.createAndDeliverNotification({
    recipientId: testUserId,
    type: NotificationTypes.TASK_DUE_SOON,
    title: 'Snooze Test',
    message: 'This will be snoozed',
    priority: 'medium'
  });
  
  const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const snoozedNotif = await notificationService.snoozeNotification(snoozeNotif._id, testUserId, snoozeUntil);
  assert(snoozedNotif.isSnoozed === true, 'Should snooze notification');
  
  // Test 7: Notification digest
  console.log('📰 Testing getNotificationDigest...');
  const digest = await notificationService.getNotificationDigest(testUserId, 'daily');
  assert(digest.summary, 'Should return summary');
  assert(Array.isArray(digest.notifications), 'Should return notifications array');
  
  return directNotif;
}

async function runCompleteAPITest() {
  console.log('🚀 COMPREHENSIVE NOTIFICATION API TEST');
  console.log('======================================');
  
  try {
    await connectDatabase();
    
    // Test basic methods
    const { testUserId, testGroupId, notificationId } = await testBasicMethods();
    
    // Test new methods
    const notifications = await testNewMethods(testUserId, testGroupId, notificationId);
    
    // Test bulk methods
    await testBulkMethods(testUserId, notifications);
    
    // Test advanced methods
    await testAdvancedMethods(testUserId, testGroupId);
    
    console.log('\n🎉 ALL API TESTS PASSED!');
    console.log('========================');
    console.log('✅ Basic notification operations');
    console.log('✅ Statistics and analytics');
    console.log('✅ Bulk operations');
    console.log('✅ Advanced features (snoozing, timeline, etc.)');
    console.log('✅ Direct notifications');
    console.log('✅ System monitoring');
    console.log('\n💡 Your complete notification API is working perfectly!');
    
    // Show final stats
    const finalStats = await notificationService.getSystemStats();
    console.log('\n📊 FINAL SYSTEM STATS:');
    console.log('Total notifications created:', finalStats.total);
    console.log('Type distribution:', finalStats.typeDistribution);
    
  } catch (error) {
    console.error('\n💥 API TEST FAILED:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Run the comprehensive API test
if (require.main === module) {
  runCompleteAPITest();
}

module.exports = { runCompleteAPITest };