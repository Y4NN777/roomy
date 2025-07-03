// src/services/notifications/WebSocketService.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const eventBus = require('./eventBus');
const { EventTypes } = require('../../utils/eventTypes');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket mapping
    this.userSockets = new Map();    // socketId -> user mapping
    this.groupRooms = new Map();     // groupId -> Set of userIds
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
    this.setupEventListeners();
    
    console.log('🔌 WebSocket service initialized');
    return this.io;
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }
        
        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.setupSocketHandlers(socket);
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;
    
    console.log(`👤 User connected: ${user.name} (${userId})`);
    
    // Store connection mappings
    this.connectedUsers.set(userId, socket);
    this.userSockets.set(socket.id, { userId, user });
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Join user's group room if they have one
    if (user.groupId) {
      const groupId = user.groupId.toString();
      socket.join(`group:${groupId}`);
      
      // Track group membership
      if (!this.groupRooms.has(groupId)) {
        this.groupRooms.set(groupId, new Set());
      }
      this.groupRooms.get(groupId).add(userId);
      
      // Notify group members of user coming online
      this.broadcastToGroup(groupId, 'user:online', {
        userId,
        userName: user.name,
        timestamp: new Date().toISOString()
      }, userId);
    }
    
    // Send connection confirmation with status
    this.sendConnectionStatus(socket);
    
    // Emit user online event
    eventBus.safeEmit(EventTypes.USER_ONLINE, {
      userId,
      groupId: user.groupId,
      timestamp: new Date()
    });
  }

  setupSocketHandlers(socket) {
    const userId = socket.userId;
    
    // Handle notification interactions
    socket.on('notification:read', (notificationId) => {
      eventBus.safeEmit('notification.read', {
        notificationId,
        userId,
        timestamp: new Date()
      });
    });

    socket.on('notification:read_all', (data) => {
      eventBus.safeEmit('notification.read_all', {
        userId,
        groupId: data?.groupId,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
    });
  }

  handleDisconnection(socket, reason) {
    const userId = socket.userId;
    const user = socket.user;
    
    console.log(`👤 User disconnected: ${user.name} (${reason})`);
    
    // Clean up mappings
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);
    
    // Clean up group membership
    if (user.groupId) {
      const groupId = user.groupId.toString();
      const groupMembers = this.groupRooms.get(groupId);
      if (groupMembers) {
        groupMembers.delete(userId);
        if (groupMembers.size === 0) {
          this.groupRooms.delete(groupId);
        }
      }
      
      // Notify group members of user going offline
      this.broadcastToGroup(groupId, 'user:offline', {
        userId,
        userName: user.name,
        timestamp: new Date().toISOString()
      }, userId);
    }
    
    // Emit user offline event
    eventBus.safeEmit(EventTypes.USER_OFFLINE, {
      userId,
      groupId: user.groupId,
      timestamp: new Date()
    });
  }

  setupEventListeners() {
    // Listen to notification events from event bus
    eventBus.on('notification.created', (data) => {
      this.deliverNotification(data.notification, data.recipients);
    });

    eventBus.on('notification.broadcast', (data) => {
      this.broadcastToGroup(data.groupId, 'notification:broadcast', data.notification);
    });

    // Listen to real-time events
    eventBus.on(EventTypes.TASK_CREATED, (data) => {
      this.broadcastToGroup(data.groupId, 'task:created', data);
    });

    eventBus.on(EventTypes.TASK_COMPLETED, (data) => {
      this.broadcastToGroup(data.groupId, 'task:completed', data);
    });

    eventBus.on(EventTypes.EXPENSE_ADDED, (data) => {
      this.broadcastToGroup(data.groupId, 'expense:added', data);
    });

    eventBus.on(EventTypes.AI_TASKS_SUGGESTED, (data) => {
      this.sendToUser(data.userId, 'ai:tasks_suggested', data);
    });
  }

  // Core delivery methods
  sendToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId.toString());
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  broadcastToGroup(groupId, event, data, excludeUserId = null) {
    const room = `group:${groupId}`;
    if (excludeUserId) {
      this.io.to(room).except(`user:${excludeUserId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } else {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  deliverNotification(notification, recipients = null) {
    if (recipients) {
      // Send to specific recipients
      recipients.forEach(userId => {
        this.sendToUser(userId, 'notification:new', notification);
      });
    } else {
      // Send to notification recipient
      this.sendToUser(notification.recipientId, 'notification:new', notification);
    }
  }

  sendConnectionStatus(socket) {
    socket.emit('connection:status', {
      connected: true,
      userId: socket.userId,
      userName: socket.user.name,
      groupId: socket.user.groupId,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString()
    });
  }

  // Utility methods
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  getGroupMembers(groupId) {
    return Array.from(this.groupRooms.get(groupId) || []);
  }

  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      totalGroups: this.groupRooms.size,
      connectedUsers: this.getConnectedUsers(),
      groupMembership: Object.fromEntries(
        Array.from(this.groupRooms.entries()).map(([groupId, members]) => [
          groupId,
          Array.from(members)
        ])
      )
    };
  }

  // Testing and development methods
  testBroadcast(message) {
    if (this.io) {
      this.io.emit('test:broadcast', {
        message,
        timestamp: new Date().toISOString(),
        connections: this.connectedUsers.size
      });
    }
  }

  // Cleanup method
  cleanup() {
    if (this.io) {
      this.io.close();
    }
    this.connectedUsers.clear();
    this.userSockets.clear();
    this.groupRooms.clear();
    console.log('🧹 WebSocketService cleaned up');
  }
}

module.exports = new WebSocketService();