// This file implements a singleton event bus for decoupled, application-wide communication between services.
// src/services/notifications/eventBus.js
const EventEmitter = require('events');

// EventBus extends Node's EventEmitter to provide a centralized pub-sub mechanism.
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Support many listeners
    this.setupEventLogging();
  }

  // Overrides the default emit method to add logging for all dispatched events.
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

  // Emits an event with integrated error handling to prevent crashes from listener exceptions.
  safeEmit(eventName, data) {
    try {
      this.emit(eventName, data);
      return true;
    } catch (error) {
      console.error(`❌ Event emission failed for ${eventName}:`, error);
      return false;
    }
  }

  // Subscribes a single handler to multiple event types for convenience.
  onMultiple(events, handler) {
    events.forEach(event => {
      this.on(event, handler);
    });
  }

  // Listens for a single event occurrence with a timeout to prevent indefinite waiting.
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

  // Retrieves statistics about the event bus, including listener counts for each event.
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

  // Removes all event listeners to ensure a clean shutdown and prevent memory leaks.
  cleanup() {
    this.removeAllListeners();
    console.log('🧹 EventBus cleaned up');
  }
}

// Create singleton instance
const eventBus = new EventBus();

module.exports = eventBus;