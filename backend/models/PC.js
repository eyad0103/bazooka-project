const { v4: uuidv4 } = require('uuid');

class PC {
  constructor(name) {
    this.id = uuidv4();
    this.name = name;
    this.apiKey = uuidv4();
    this.registeredAt = new Date();
    this.lastHeartbeat = null;
    this.status = 'OFFLINE';
    this.cpu = 0;
    this.memory = 0;
    this.uptime = 0;
    this.apps = [];
  }
}

module.exports = PC;
