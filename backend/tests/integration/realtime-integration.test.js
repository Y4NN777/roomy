// tests/integration/realtime-real-mongo.test.js
// Uses REAL MongoDB instead of Memory Server

const mongoose = require('mongoose');

// Set up test environment FIRST
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.GEMINI_API_KEY = 'test-key';

describe('REAL Integration Tests - Real MongoDB', () => {
  let testUserId, testGroupId;
  let eventBus, notificationService, Notification;
  let EventTypes, NotificationTypes;

  beforeAll(async () => {
    // Use real MongoDB connection (make sure MongoDB is running)
    const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/roomy_jest_integration_test';
    
    console.log('🗄️  Connecting to real MongoDB:', testDbUri);
    await mongoose.connect(testDbUri);
    console.log('✅ Connected to real MongoDB');
    
    // Import modules AFTER connection
    eventBus = require('../../src/services/notifications/eventBus');
    notificationService = require('../../src/services/notifications/notificationService');
    Notification = require('../../src/models/Notification');
    const eventTypes = require('../../src/utils/eventTypes');
    EventTypes = eventTypes.EventTypes;
    NotificationTypes = eventTypes.NotificationTypes;
    
    console.log('📦 All modules imported successfully');
  });

  afterAll(async () => {
    try {
      // Clean up test database
      await Notification.deleteMany({});
      
      // Cleanup services
      if (eventBus && typeof eventBus.cleanup === 'function') {
        eventBus.cleanup();
      }
      if (notificationService && typeof notificationService.cleanup === 'function') {
        notificationService.cleanup();
      }
      
      await mongoose.disconnect();
      console.log('🗄️  Disconnected from MongoDB');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  });

  beforeEach(async () => {
    // Clear test data
    await Notification.deleteMany({});
    
    // Create test IDs
    testUserId = new mongoose.Types.ObjectId();
    testGroupId = new mongoose.Types.ObjectId();
    
    console.log('🧹 Test data cleared');
  });

  test('REAL TEST: Should create notification when task assigned event emitted', async () => {
    console.log('🧪 Testing real task assignment flow...');
    
    // Real event data
    const taskData = {
      task: {
        _id: new mongoose.Types.ObjectId(),
        title: 'Jest Integration Test Task',
        assignedTo: testUserId,
        groupId: testGroupId,
        priority: 'high'
      },
      assignedUser: { name: 'Jest Test User' },
      assignedBy: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Jest Assigner'
      }
    };

    // Emit REAL event
    console.log('📡 Emitting task assigned event...');
    eventBus.emit(EventTypes.TASK_ASSIGNED, taskData);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check REAL database
    const notifications = await Notification.find({ recipientId: testUserId });
    
    // Assertions
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe(NotificationTypes.TASK_ASSIGNED);
    let assignmentCount = 0;

    expect(notifications[0].title).toBe('New Task Assigned', assignmentCount++);
    expect(notifications[0].message).toContain('Jest Integration Test Task');
    expect(notifications[0].isRead).toBe(false);
    
    console.log('✅ Real notification created successfully!');
    console.log('📋 Notification:', {
      id: notifications[0]._id.toString(),
      type: notifications[0].type,
      title: notifications[0].title
    });
  });

  test('REAL TEST: Should mark notification as read', async () => {
    console.log('🧪 Testing mark as read functionality...');
    
    // Create notification
    const notification = await Notification.create({
      recipientId: testUserId,
      groupId: testGroupId,
      type: NotificationTypes.TASK_ASSIGNED,
      title: 'Jest Test Notification',
      message: 'Testing mark as read',
      isRead: false,
      data: {
        actorId: new mongoose.Types.ObjectId(),
        actorName: 'Jest Tester'
      }
    });
    
    // Mark as read using real service
    const result = await notificationService.markAsRead(notification._id, testUserId);
    
    // Verify
    expect(result.isRead).toBe(true);
    expect(result.readAt).toBeDefined();
    
    // Double-check in database
    const updated = await Notification.findById(notification._id);
    expect(updated.isRead).toBe(true);
    
    console.log('✅ Mark as read works correctly!');
  });

  test('REAL TEST: Should get correct unread count', async () => {
    console.log('🧪 Testing unread count...');
    
    // Create test notifications
    await Notification.create([
      {
        recipientId: testUserId,
        type: NotificationTypes.TASK_ASSIGNED,
        title: 'Jest Unread 1',
        message: 'Test message 1',
        isRead: false
      },
      {
        recipientId: testUserId,
        type: NotificationTypes.TASK_ASSIGNED,
        title: 'Jest Unread 2',
        message: 'Test message 2',
        isRead: false
      },
      {
        recipientId: testUserId,
        type: NotificationTypes.TASK_COMPLETED,
        title: 'Jest Read',
        message: 'Already read',
        isRead: true,
        readAt: new Date()
      }
    ]);
    
    // Get unread count
    const count = await notificationService.getUnreadCount(testUserId);
    
    expect(count).toBe(2);
    
    console.log('✅ Unread count correct:', count);
  });

  test('REAL TEST: Should handle direct service calls', async () => {
    console.log('🧪 Testing direct service calls...');
    
    const notificationData = {
      recipientId: testUserId,
      groupId: testGroupId,
      type: NotificationTypes.TASK_ASSIGNED,
      title: 'Direct Service Test',
      message: 'Testing direct service call',
      data: {
        actorId: new mongoose.Types.ObjectId(),
        actorName: 'Service Tester'
      },
      priority: 'medium'
    };
    
    // Call service directly
    const notification = await notificationService.createAndDeliverNotification(notificationData);
    
    // Verify
    expect(notification).toBeTruthy();
    expect(notification.type).toBe(NotificationTypes.TASK_ASSIGNED);
    expect(notification.title).toBe('Direct Service Test');
    
    // Check in database
    const dbNotification = await Notification.findById(notification._id);
    expect(dbNotification).toBeTruthy();
    
    console.log('✅ Direct service call works!');
  });
});

jest.setTimeout(30000);