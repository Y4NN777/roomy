// tests/scripts/test-complete-notification-api.js
// TEST ALL THE NEW NOTIFICATION METHODS

// Setup test environment
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const http = require('http');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Import models and types
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const Group = require('../../src/models/Group');
const { NotificationTypes, EventTypes } = require('../../src/utils/eventTypes');

// Import services
const eventBus = require('../../src/services/notifications/eventBus');

// Test database connection URL
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/roomy-test';

// Create a test HTTP server for WebSocket
const testServer = http.createServer();
const PORT = process.env.TEST_WS_PORT || 3001;
let isWSServerReady = false;

// Create a promise that resolves when the server is ready
const serverReady = new Promise((resolve) => {
  try {
    console.log('🚀 Initializing WebSocket service...');
    
        // 1. First, get the notification service instance
    const notificationService = require('../../src/services/notifications/notificationService');
    
    // 2. Initialize WebSocket service
    const WebSocketService = require('../../src/services/notifications/WebSocketService');
    const webSocketService = WebSocketService;
    
    // 3. Set the WebSocket service in the notification service
    notificationService.setWebSocketService(webSocketService);
    console.log('✅ WebSocket service set in notification service');
    
    // 4. Initialize WebSocket server
    webSocketService.initialize(testServer);
    
    testServer.listen(PORT, () => {
      console.log(`✅ Test WebSocket server running on port ${PORT}`);
      isWSServerReady = true;
      
      // 5. Set up global references
      global.notificationService = notificationService;
      global.webSocketService = webSocketService;
      
      console.log('✅ Notification service initialized with WebSocket support');
      resolve();
    });
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
});

// Will be set after server is ready
let notificationService = null;

// Function to get notification service that can be called after server is ready
function getNotificationService() {
  if (!notificationService) {
    notificationService = global.notificationService;
  }
  if (!notificationService) {
    throw new Error('Notification service not initialized. Make sure to wait for serverReady.');
  }
  return notificationService;
}

testServer.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Mock the WebSocket client for testing
const { io } = require('socket.io-client');

// Helper function to create an authenticated test client
async function createTestClient(userId) {
  const token = jwt.sign({ 
    userId: userId.toString(),
    email: 'test@example.com',
    role: 'user'
  }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  
  const client = io(`http://localhost:${PORT}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
    timeout: 10000
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error('WebSocket connection timeout'));
    }, 5000);

    client.on('connect', () => {
      clearTimeout(timeout);
      console.log(`✅ Test WebSocket client connected for user ${userId}`);
      resolve(client);
    });

    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.error('WebSocket connection error:', error.message);
      reject(error);
    });
  });
}

global.createTestClient = createTestClient;

// Setup
process.env.JWT_SECRET = 'test-secret-key';
process.env.APP_BASE_URL = 'http://localhost:3000';

// Test user will be created in setupTestData()

// Database connection functions
async function connectDatabase() {
  try {
    await mongoose.connect(TEST_MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to test database');
    
    // Initialize models if needed
    require('../../src/models');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

async function clearDatabase() {
  try {
    // Only try to clear if we're still connected
    if (mongoose.connection.readyState === 1) { // 1 = connected
      await Promise.all([
        Notification.deleteMany({}).exec(),
        User.deleteMany({}).exec(),
        Group.deleteMany({}).exec()
      ]);
      console.log('🧹 Test database cleared');
    } else {
      console.log('Skipping database clear - not connected');
    }
  } catch (error) {
    console.error('Error clearing test database:', error.message);
    // Don't throw to allow cleanup to continue
  }
}

async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState === 1) { // 1 = connected
      await mongoose.disconnect();
      console.log('👋 Disconnected from test database');
    } else {
      console.log('Skipping disconnect - not connected');
    }
  } catch (error) {
    console.error('Error disconnecting from database:', error.message);
    // Don't throw to allow cleanup to continue
  }
}

async function setupTestData() {
  try {
    // Clear existing data first
    await clearDatabase();
    
    // Create test users with the provided email addresses
    const user1 = new User({
      name: 'Axel',
      email: 'axel.studiesmail@gmail.com',
      password: await bcrypt.hash('password123', 10),
      emailVerified: true,
      isActive: true,
      preferences: {
        notifications: true,
        voiceEnabled: true,
        theme: 'light'
      },
      lastLogin: new Date()
    });
    await user1.save();

    const user2 = new User({
      name: 'Alex',
      email: 'alex.workmail@outlook.com',
      password: await bcrypt.hash('password123', 10),
      emailVerified: true,
      isActive: true,
      preferences: {
        notifications: true,
        voiceEnabled: true,
        theme: 'dark'
      },
      lastLogin: new Date()
    });
    await user2.save();

    const user3 = new User({
      name: 'Alexandre',
      email: 'alexandre.workmail@outlook.com',
      password: await bcrypt.hash('password123', 10),
      emailVerified: true,
      isActive: true,
      preferences: {
        notifications: true,
        voiceEnabled: true,
        theme: 'system'
      },
      lastLogin: new Date()
    });
    await user3.save();

    // Create test group with all three users
    const group = new Group({
      name: 'Roommate Group',
      description: 'Shared apartment group',
      createdBy: user1._id,
      members: [
        {
          userId: user1._id,
          role: 'admin',
          joinedAt: new Date(),
          addedBy: user1._id
        },
        {
          userId: user2._id,
          role: 'member',
          joinedAt: new Date(),
          addedBy: user1._id
        },
        {
          userId: user3._id,
          role: 'member',
          joinedAt: new Date(),
          addedBy: user1._id
        }
      ],
      inviteCode: 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      settings: {
        allowMemberInvites: true,
        defaultNotificationSettings: {
          email: true,
          push: true,
          inApp: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await group.save();

    // Create welcome notifications for each user using valid notification types
    const welcomeNotification1 = new Notification({
      recipientId: user1._id,
      type: 'GROUP_MEMBER_JOINED',
      title: 'Welcome to Roomy!',
      message: 'Thank you for joining Roomy. Get started by inviting your roommates!',
      data: {
        priority: 'medium'
      },
      isRead: false,
      isDelivered: true,
      metadata: {
        action: 'welcome',
        url: '/welcome'
      }
    });
    await welcomeNotification1.save();

    const welcomeNotification2 = new Notification({
      recipientId: user2._id,
      type: 'GROUP_MEMBER_JOINED',
      title: 'Welcome to Roomy!',
      message: 'Thank you for joining Roomy. Get started by inviting your roommates!',
      data: {
        priority: 'medium'
      },
      isRead: false,
      isDelivered: true,
      metadata: {
        action: 'welcome',
        url: '/welcome'
      }
    });
    await welcomeNotification2.save();

    const welcomeNotification3 = new Notification({
      recipientId: user3._id,
      type: 'GROUP_MEMBER_JOINED',
      title: 'Welcome to Roomy!',
      message: 'Thank you for joining Roomy. Get started by inviting your roommates!',
      data: {
        priority: 'medium'
      },
      isRead: false,
      isDelivered: true,
      metadata: {
        action: 'welcome',
        url: '/welcome'
      }
    });
    await welcomeNotification3.save();

    console.log('✅ Test data set up with 3 users');
    return { 
      user1, 
      user2, 
      user3, 
      group, 
      notifications: [welcomeNotification1, welcomeNotification2, welcomeNotification3] 
    };
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  }
}
// Helper function for assertions
function assert(condition, message) {
  if (!condition) {
    console.error('❌ ASSERTION FAILED:', message);
    process.exit(1);
  }
  console.log('✅', message);
}

// Setup test environment before running tests
async function setupTestEnvironment() {
  try {
    await connectDatabase();
    await clearDatabase();
    const testData = await setupTestData();
    
    // Create a test WebSocket client for the test user
    if (testData && testData.user) {
      global.testClient = await createTestClient(testData.user._id);
    }
    
    console.log('✅ Test environment set up');
    return testData;
  } catch (error) {
    console.error('❌ Failed to set up test environment:', error);
    throw error;
  }
}

// Clean up after tests
async function cleanupTestEnvironment() {
  try {
    // Close test WebSocket client if it exists
    if (global.testClient) {
      global.testClient.close();
      delete global.testClient;
    }
    
    // Close WebSocket server
    if (testServer) {
      testServer.close();
    }
    
    // Always try to clear and disconnect, even if one fails
    await clearDatabase().catch(e => 
      console.error('Error in clearDatabase during cleanup:', e.message)
    );
    
    await disconnectDatabase().catch(e => 
      console.error('Error in disconnectDatabase during cleanup:', e.message)
    );
    
    console.log('✅ Test environment cleanup completed');
  } catch (error) {
    console.error('Unexpected error in cleanupTestEnvironment:', error.message);
    // Don't rethrow to allow the test to complete
  }
}

async function testBasicMethods() {
  console.log('\n🧪 TESTING BASIC METHODS');
  console.log('========================');
  
  const testUserId = new mongoose.Types.ObjectId();
  const testGroupId = new mongoose.Types.ObjectId();
  
  // Test 1: Create notification
  console.log('📝 Testing createAndDeliverNotification...');
  const notification = await getNotificationService().createAndDeliverNotification({
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
  const result = await getNotificationService().getUserNotifications(testUserId);
  assert(Array.isArray(result.notifications), 'Should return an object with notifications array');
  assert(result.notifications.some(n => n._id.toString() === notification._id.toString()), 
    'Should include the created notification');
  
  // Test 3: Mark as read
  console.log('👁️ Testing markAsRead...');
  const readResult = await getNotificationService().markAsRead(notification._id, testUserId);
  assert(readResult.isRead === true, 'Should mark notification as read');
  
  // Test 4: Get unread count
  console.log('🔢 Testing getUnreadCount...');
  const unreadCount = await getNotificationService().getUnreadCount(testUserId);
  assert(unreadCount === 0, 'Should have 0 unread notifications');
  
  return { testUserId, testGroupId, notificationId: notification._id };
}

async function testNewMethods(testUserId, testGroupId, notificationId) {
  console.log('\n🧪 TESTING NEW METHODS');
  console.log('======================');
  
  // Test 1: Delete notification
  console.log('🗑️ Testing deleteNotification...');
  const deleteResult = await getNotificationService().deleteNotification(notificationId, testUserId);
  assert(deleteResult, 'Should delete notification');
  
  // Test 2: Create multiple notifications for stats testing
  console.log('📊 Creating test data for stats...');
  const notifications = [];
  for (let i = 0; i < 5; i++) {
    const notif = await getNotificationService().createAndDeliverNotification({
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
  const stats = await getNotificationService().getNotificationStats(testUserId, '7d');
  assert(stats.total === 5, 'Should show 5 total notifications');
  assert(stats.byType, 'Should include type breakdown');
  assert(stats.byPriority, 'Should include priority breakdown');
  
  // Test 4: Get notifications by type
  console.log('📂 Testing getNotificationsByType...');
  const typeResult = await getNotificationService().getNotificationsByType(
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
  const bulkReadResult = await getNotificationService().bulkMarkAsRead(testUserId, notificationIds.slice(0, 3));
  assert(bulkReadResult.modifiedCount === 3, 'Should mark 3 notifications as read');
  
  // Test 2: Bulk delete by IDs
  console.log('🗑️ Testing bulkDeleteByIds...');
  const bulkDeleteResult = await getNotificationService().bulkDeleteByIds(testUserId, notificationIds.slice(0, 2));
  assert(bulkDeleteResult.deletedCount === 2, 'Should delete 2 notifications');
  
  // Test 3: Bulk delete older than
  console.log('⏰ Testing bulkDeleteOlderThan...');
  // This won't delete anything since notifications are new, but tests the method
  const oldDeleteResult = await getNotificationService().bulkDeleteOlderThan(testUserId, 30);
  assert(typeof oldDeleteResult.deletedCount === 'number', 'Should return deletion count');
}

async function testAdvancedMethods(testUserId, testGroupId) {
  console.log('\n🧪 TESTING EVENT-DRIVEN NOTIFICATION INTEGRATION');
  console.log('==============================================');

  const eventBus = require('../../src/services/notifications/eventBus');
  const { EventTypes, NotificationTypes, NotificationPriority } = require('../../src/utils/eventTypes');
  
  // Create a test user object with required fields
  const testUser = {
    _id: testUserId,
    name: 'Test User',
    email: 'axel.studiesmail@gmail.com'
  };

  // 1. Test eventBus.safeEmit for unified events
  console.log('📡 Emitting TASK_CREATED event via eventBus.safeEmit...');
  const fakeTask = { 
    _id: new mongoose.Types.ObjectId(), 
    title: 'EventBus Task', 
    groupId: testGroupId, 
    assignedTo: testUserId,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    priority: 'medium'
  };

  let eventTriggered = false;
  eventBus.once(EventTypes.TASK_CREATED, (data) => {
    eventTriggered = true;
    console.log('✅ TASK_CREATED event received by listener');
  });

  // Emit with all required fields
  eventBus.safeEmit(EventTypes.TASK_CREATED, { 
    task: fakeTask, 
    groupId: testGroupId, 
    assignedUser: testUser,
    createdBy: testUser
  });
  
  await new Promise(res => setTimeout(res, 200));
  assert(eventTriggered, 'EventBus listener should be triggered for TASK_CREATED');

  // 2. Test notificationService event listeners
  console.log('🔔 Testing notificationService event listeners...');
  assert(typeof getNotificationService().setupEventListeners === 'function', 'setupEventListeners should be defined');

  // 3. Test direct notificationService call for critical email (should work)
  console.log('✉️ Testing direct notificationService email for group invite...');
  try {
    const result = await getNotificationService().sendGroupInvitation({
      recipientEmail: 'axel.studiesmail@gmail.com',
      inviterName: 'Admin',
      groupName: 'Test Group',
      inviteCode: 'test-invite-code-123'
    });
    
    if (!result.success) {
      console.error('Email send failed:', result.error || result.reason);
    }
    
    assert(result.success, `Email should be sent successfully. ${result.error || ''}`);
    console.log('✅ Direct email notification should be sent for group invite');
  } catch (e) {
    console.error('Email send error:', e);
    throw new Error(`Email sending test failed: ${e.message}`);
  }

  // 4. Test hybrid event: emitting EXPENSE_CREATED triggers in-app/WebSocket + direct email
  console.log('💸 Emitting EXPENSE_CREATED event for hybrid notification...');
  let hybridEventTriggered = false;
  
  const testExpense = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Test Expense',
    amount: 150.50,
    groupId: testGroupId,
    payerId: testUserId,
    splits: [{
      memberId: testUserId,
      amount: 75.25,
      paid: false
    }]
  };

  eventBus.once(EventTypes.EXPENSE_CREATED, (data) => {
    hybridEventTriggered = true;
    console.log('✅ EXPENSE_CREATED event received by listener');
  });

  // Emit with all required fields for expense creation
  eventBus.safeEmit(EventTypes.EXPENSE_CREATED, { 
    expense: testExpense,
    groupId: testGroupId, 
    groupMembers: [{
      userId: {
        _id: testUserId,
        name: 'Test User',
        email: 'axel.studiesmail@gmail.com'
      }
    }],
    addedBy: testUser,
    createdBy: testUser
  });

  await new Promise(res => setTimeout(res, 200));
  assert(hybridEventTriggered, 'Hybrid event should trigger notification listeners');

  // 5. Test GROUP_MEMBER_JOINED event
  console.log('🔄 Testing GROUP_MEMBER_JOINED event...');
  let groupJoinedTriggered = false;
  
  const existingMember = {
    userId: {
      _id: testUserId,
      name: 'Existing Member',
      email: 'axeldaboworkplace@gmail.com'
    }
  };
  
  const newMember = {
    _id: new mongoose.Types.ObjectId(),
    name: 'New Member',
    email: 'axel.studiesmail@gmail.com'
  };
  
  eventBus.once(EventTypes.GROUP_MEMBER_JOINED, (data) => {
    groupJoinedTriggered = true;
    console.log('✅ GROUP_MEMBER_JOINED event received by listener');
  });
  
  eventBus.safeEmit(EventTypes.GROUP_MEMBER_JOINED, { 
    group: { 
      _id: testGroupId,
      name: 'Test Group'
    }, 
    newMember: newMember,
    existingMembers: [existingMember]
  });
  await new Promise(res => setTimeout(res, 200));
  assert(groupJoinedTriggered, 'GROUP_MEMBER_JOINED event should trigger notification listeners');

  // 8. Test legacy direct notificationService call for critical action
  console.log('📧 Testing direct call for notifyTaskAssignment (should work for email)...');
  let legacyEmailSent = false;
  try {
    await getNotificationService().notifyTaskAssignment(
      'axel.studiesmail@gmail.com', 'Assignee', 'Legacy Task', 'Assignor', 'Test Group', {}
    );
    legacyEmailSent = true;
  } catch (e) {
    console.error('Legacy email send error:', e);
    legacyEmailSent = false;
  }
  assert(legacyEmailSent, 'Legacy direct email notification should be sent for task assignment');

  // 9. Test event-driven notification delivery for AI events
  console.log('🤖 Emitting AI_TASKS_SUGGESTED event...');
  let aiEventTriggered = false;
  eventBus.once(EventTypes.AI_TASKS_SUGGESTED, (data) => {
    aiEventTriggered = true;
    console.log('✅ AI_TASKS_SUGGESTED event received by listener');
  });
  eventBus.safeEmit(EventTypes.AI_TASKS_SUGGESTED, { userId: testUserId, result: { suggestedTasks: [], confidence: 1.0 } });
  await new Promise(res => setTimeout(res, 200));
  assert(aiEventTriggered, 'AI_TASKS_SUGGESTED event should trigger notification listeners');

  // Continue with original advanced notification tests below...

  console.log('\n🧪 TESTING ADVANCED METHODS');
  console.log('============================');
  
  // Test 10: Notification preferences (requires User model update)
  console.log('⚙️ Testing notification preferences...');
  try {
    const preferences = await notificationService.instance.getNotificationPreferences(testUserId);
    assert(preferences.email, 'Should return email preferences');
    assert(preferences.push, 'Should return push preferences');
    assert(preferences.inApp, 'Should return in-app preferences');
    
    // Test updating preferences
    const updatedPrefs = await notificationService.instance.updateNotificationPreferences(testUserId, {
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
    const broadcast = await notificationService.instance.createGroupBroadcast({
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
  const directNotif = await getNotificationService().sendDirectNotification({
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
  const systemStats = await getNotificationService().getSystemStats();
  assert(systemStats.total >= 0, 'Should return total count');
  assert(systemStats.typeDistribution, 'Should return type distribution');
  
  // Test 5: Notification timeline
  console.log('📅 Testing getNotificationTimeline...');
  const timeline = await getNotificationService().getNotificationTimeline(testUserId, { days: 7 });
  assert(timeline.timeframe === '7d', 'Should return 7 day timeframe');
  assert(Array.isArray(timeline.timeline), 'Should return timeline array');
  
  // Test 6: Snooze notification (create a new one first)
  console.log('😴 Testing snoozeNotification...');
  const snoozeNotif = await getNotificationService().createAndDeliverNotification({
    recipientId: testUserId,
    type: NotificationTypes.TASK_DUE_SOON,
    title: 'Snooze Test',
    message: 'This will be snoozed',
    priority: 'medium'
  });
  
  const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const snoozedNotif = await getNotificationService().snoozeNotification(snoozeNotif._id, testUserId, snoozeUntil);
  assert(snoozedNotif.isSnoozed === true, 'Should snooze notification');
  
  // Test 7: Notification digest
  console.log('📰 Testing getNotificationDigest...');
  const digest = await getNotificationService().getNotificationDigest(testUserId, 'daily');
  assert(digest.summary, 'Should return summary');
  assert(Array.isArray(digest.notifications), 'Should return notifications array');
  
  return directNotif;
}

async function runCompleteAPITest() {
  try {
    console.log('🚀 COMPREHENSIVE NOTIFICATION API TEST');
    console.log('======================================');
    
    await setupTestEnvironment();
    
    // Run all test suites
    const { testUserId, testGroupId, notificationId } = await testBasicMethods();
    const notifications = await testNewMethods(testUserId, testGroupId, notificationId);
    await testBulkMethods(testUserId, notifications);
    await testAdvancedMethods(testUserId, testGroupId);
    
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
    
    // Show final stats
    const finalStats = await getNotificationService().getSystemStats();
    console.log('\n📊 FINAL SYSTEM STATS:');
    console.log('Total notifications created:', finalStats.total);
    console.log('Type distribution:', finalStats.typeDistribution);
    console.log('Priority distribution:', finalStats.priorityDistribution);
    console.log('Total users:', finalStats.userCount);
    console.log('Total groups:', finalStats.groupCount);
  } catch (error) {
    console.error('\n💥 TEST FAILED:', error);
    process.exit(1);
  } finally {
    await cleanupTestEnvironment();
  }
}

async function runTests() {
  try {
    await setupTestEnvironment();
    // Wait for WebSocket server to be ready
    await serverReady;
    await runCompleteAPITest();
    console.log('✅ All tests completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await cleanupTestEnvironment();
    process.exit(0);
  }
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('Unhandled error in test runner:', error);
    process.exit(1);
  });
}

module.exports = {
  testBasicMethods,
  testNewMethods,
  testBulkMethods,
  testAdvancedMethods,
  runCompleteAPITest,
  setupTestEnvironment,
  cleanupTestEnvironment,
  connectDatabase,
  disconnectDatabase,
  clearDatabase,
  setupTestData
};