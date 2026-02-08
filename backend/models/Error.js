const { v4: uuidv4 } = require('uuid');

class Error {
  constructor(pcId, pcName, type, message, details = null) {
    this.id = uuidv4();
    this.pcId = pcId;
    this.pcName = pcName;
    this.type = type; // CRITICAL, WARNING, INFO
    this.message = message;
    this.details = details;
    this.timestamp = new Date();
    this.resolved = false;
  }
}

module.exports = Error;
