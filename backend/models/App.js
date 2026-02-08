const { v4: uuidv4 } = require('uuid');

class App {
  constructor(pcId, pcName, name, status, version = 'unknown') {
    this.id = uuidv4();
    this.pcId = pcId;
    this.pcName = pcName;
    this.name = name;
    this.status = status; // RUNNING, STOPPED, NOT_RESPONDING, CRASHED
    this.version = version;
    this.memoryUsage = '0 MB';
    this.cpuUsage = '0%';
    this.lastUpdated = new Date();
  }
}

module.exports = App;
