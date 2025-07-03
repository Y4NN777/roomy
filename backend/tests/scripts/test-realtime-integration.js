// scripts/test-realtime-integration.js
// RUN WITH: node scripts/test-realtime-integration.js

const mongoose = require('mongoose');
const path = require('path');

// Setup environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Import real services
const eventBus = require('../../src/services/notifications/eventBus');
const notificationService = require('../../src/services/notifications/notificationService');
const Notification = require('../../src/models/Notification');
const { EventTypes, NotificationTypes } = require('../../src/utils/eventTypes');

// Test utilities
function assert(condition, message) {
  if (!condition) {
    console.error('❌ ASSERTION FAILED:', message);
    process.exit(1);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error('❌ ASSERTION FAILED:', message);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    process.exit(1);
  }
}

async function connectDatabase() {
  try {
    // Use your actual test database or create a temporary one
    const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/roomy_integration_test';
    
    console.log('🗄️  Connecting to database:', testDbUri);
    await mongoose.connect(testDbUri);
    console.log('✅ Database connected');
    
    // Clear test data
    await Notification.deleteMany({});
    console.log('🧹 Database cleared');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running or set TEST_MONGO_URI environment variable');
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('🗄️  Database disconnected');
  } catch (error) {
    console.error('❌ Database disconnect failed:', error.message);
  }
}

async function testTaskAssignmentFlow() {
  console.log('\n🧪 TEST 1: Task Assignment Notification Flow');
  console.log('================================================');
  
  const testUserId = new mongoose.Types.ObjectId();
  const testGroupId = new mongoose.Types.ObjectId();
  
  const taskData = {
    task: {
      _id: new mongoose.Types.ObjectId(),
      title: 'Integration Test Task',
      assignedTo: testUserId,
      groupId: testGroupId,
      priority: 'high'
    },
    assignedUser: { name: 'Test User' },
    assignedBy: {
      _id: new mongoose.Types.ObjectId(),
      name: 'Integration Tester'
    }
  };

  console.log('📡 Emitting TASK_ASSIGNED event...');
  eventBus.emit(EventTypes.TASK_ASSIGNED, taskData);

  console.log('⏳ Waiting for async processing...');
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('🔍 Checking database for notifications...');
  const notifications = await Notification.find({ recipientId: testUserId });
  
  // Assertions
  assertEqual(notifications.length, 1, 'Should create exactly 1 notification');
  assertEqual(notifications[0].type, NotificationTypes.TASK_ASSIGNED, 'Should have correct notification type');
  assertEqual(notifications[0].title, 'New Task Assigned', 'Should have correct title');
  assert(notifications[0].message.includes('Integration Test Task'), 'Should mention task name in message');
  assertEqual(notifications[0].isRead, false, 'Should be unread initially');
  
  console.log('✅ Task assignment flow works correctly!');
  console.log('📋 Created notification:', {
    id: notifications[0]._id.toString(),
    type: notifications[0].type,
    title: notifications[0].title,
    message: notifications[0].message,
    isRead: notifications[0].isRead
  });
  
  return { testUserId, notifications: notifications[0] };
}

async function testMarkAsRead(testUserId, notification) {
  console.log('\n🧪 TEST 2: Mark Notification as Read');
  console.log('====================================');
  
  console.log('🔄 Marking notification as read...');
  const result = await notificationService.markAsRead(notification._id, testUserId);
  
  // Assertions
  assert(result, 'Should return a result');
  assertEqual(result.isRead, true, 'Should mark notification as read');
  assert(result.readAt, 'Should set readAt timestamp');
  
  // Verify in database
  const updatedNotification = await Notification.findById(notification._id);
  assertEqual(updatedNotification.isRead, true, 'Should persist read status to database');
  assert(updatedNotification.readAt, 'Should persist readAt timestamp to database');
  
  console.log('✅ Mark as read works correctly!');
  console.log('📋 Updated notification:', {
    id: updatedNotification._id.toString(),
    isRead: updatedNotification.isRead,
    readAt: updatedNotification.readAt.toISOString()
  });
}

async function testUnreadCount() {
  console.log('\n🧪 TEST 3: Unread Count Functionality');
  console.log('=====================================');
  
  const testUserId = new mongoose.Types.ObjectId();
  
  // Create test notifications
  console.log('📝 Creating test notifications...');
  await Notification.create([
    {
      recipientId: testUserId,
      type: NotificationTypes.TASK_ASSIGNED,
      title: 'Unread Test 1',
      message: 'This should be unread',
      isRead: false
    },
    {
      recipientId: testUserId,
      type: NotificationTypes.TASK_ASSIGNED,
      title: 'Unread Test 2',
      message: 'This should also be unread',
      isRead: false
    },
    {
      recipientId: testUserId,
      type: NotificationTypes.TASK_COMPLETED,
      title: 'Read Test',
      message: 'This should be read',
      isRead: true,
      readAt: new Date()
    }
  ]);
  
  console.log('🔢 Getting unread count...');
  const count = await notificationService.getUnreadCount(testUserId);
  
  // Assertions
  assertEqual(count, 2, 'Should return correct unread count');
  
  console.log('✅ Unread count works correctly!');
  console.log('📊 Unread count:', count);
}

async function testMultipleRapidEvents() {
  console.log('\n🧪 TEST 4: Multiple Rapid Events');
  console.log('=================================');
  
  const testUserId = new mongoose.Types.ObjectId();
  const testGroupId = new mongoose.Types.ObjectId();
  
  console.log('📡 Emitting 5 rapid events...');
  
  for (let i = 0; i < 5; i++) {
    const taskData = {
      task: {
        _id: new mongoose.Types.ObjectId(),
        title: `Rapid Event Task ${i}`,
        assignedTo: testUserId,
        groupId: testGroupId,
        priority: 'medium'
      },
      assignedUser: { name: 'Test User' },
      assignedBy: {
        _id: new mongoose.Types.ObjectId(),
        name: `Rapid Tester ${i}`
      }
    };

    eventBus.emit(EventTypes.TASK_ASSIGNED, taskData);
    console.log(`   📡 Event ${i + 1}/5 emitted`);
  }

  console.log('⏳ Waiting for all events to process...');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('🔍 Checking results...');
  const notifications = await Notification.find({ recipientId: testUserId }).sort({ createdAt: 1 });
  
  // Assertions
  assertEqual(notifications.length, 5, 'Should create 5 notifications');
  
  notifications.forEach((notification, index) => {
    assert(notification.message.includes(`Rapid Event Task ${index}`), `Notification ${index} should have correct message`);
    assertEqual(notification.type, NotificationTypes.TASK_ASSIGNED, `Notification ${index} should have correct type`);
    assertEqual(notification.isRead, false, `Notification ${index} should be unread`);
  });
  
  console.log('✅ Multiple rapid events handled correctly!');
  console.log('📊 Created notifications:', notifications.map((n, i) => `${i + 1}. ${n.title}`));
}

async function runIntegrationTests() {
  console.log('🚀 STARTING REAL-TIME NOTIFICATION INTEGRATION TESTS');
  console.log('====================================================');
  
  try {
    await connectDatabase();
    
    const { testUserId, notifications } = await testTaskAssignmentFlow();
    await testMarkAsRead(testUserId, notifications);
    await testUnreadCount();
    await testMultipleRapidEvents();
    
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('================================');
    console.log('✅ Task assignment notifications work');
    console.log('✅ Mark as read functionality works');
    console.log('✅ Unread count calculation works');
    console.log('✅ Multiple rapid events handled correctly');
    console.log('\n💡 The real-time notification system is working with real database operations!');
    
  } catch (error) {
    console.error('\n💥 INTEGRATION TEST FAILED:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Run the tests
if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };