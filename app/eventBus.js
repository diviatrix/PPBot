const EventEmitter = require('events');

class EventBus extends EventEmitter {}

// Singleton pattern
module.exports = new EventBus();