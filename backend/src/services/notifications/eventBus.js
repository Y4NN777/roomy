// src/services/notifications/eventBus.js
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Support many listeners
    this.setupEventLogging();
  }

  setupEventLogging() {
    // Override emit to log all events (since onAny doesn't exist in built-in EventEmitter)
    const originalEmit = this.emit;
    this.emit = (...args) => {
      const [eventName, data] = args;
      console.log(`📡 Event: ${eventName}`, {
        timestamp: new Date().toISOString(),
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'none'
      });
      return originalEmit.apply(this, args);
    };
  }

  // Enhanced emit with error handling
  safeEmit(eventName, data) {
    try {
      this.emit(eventName, data);
      return true;
    } catch (error) {
      console.error(`❌ Event emission failed for ${eventName}:`, error);
      return false;
    }
  }

  // Subscribe to multiple events with single handler
  onMultiple(events, handler) {
    events.forEach(event => {
      this.on(event, handler);
    });
  }

  // One-time listener with timeout
  onceWithTimeout(eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(eventName, listener);
        reject(new Error(`Event ${eventName} timeout after ${timeout}ms`));
      }, timeout);

      const listener = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      this.once(eventName, listener);
    });
  }

  // Get listener count for monitoring
  getStats() {
    const events = this.eventNames();
    const stats = {};
    
    events.forEach(event => {
      stats[event] = this.listenerCount(event);
    });
    
    return {
      totalEvents: events.length,
      totalListeners: Object.values(stats).reduce((sum, count) => sum + count, 0),
      eventStats: stats
    };
  }

  // Graceful shutdown - THIS WAS MISSING!
  cleanup() {
    this.removeAllListeners();
    console.log('🧹 EventBus cleaned up');
  }
}

// Create singleton instance
const eventBus = new EventBus();

module.exports = eventBus;