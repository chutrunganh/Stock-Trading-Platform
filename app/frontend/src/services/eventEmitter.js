// filepath: c:\Users\Chu Trung Anh\Desktop\Project\Product\Stock-Market-Simulator\app\frontend\src\services\eventEmitter.js
/**
 * Simple event emitter service for cross-component communication
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    
    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  // Unsubscribe from an event
  off(event, listener) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }
  
  // Emit an event with data
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(listener => {
      listener(...args);
    });
  }
}

// Create a singleton instance
const eventEmitter = new EventEmitter();

export default eventEmitter;
