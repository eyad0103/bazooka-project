const { v4: uuidv4 } = require('uuid');

class Error {
  constructor(pcId, pcName, errorType, message, details = {}) {
    this.errorId = uuidv4();
    this.pcId = pcId;
    this.pcName = pcName;
    this.errorType = errorType;
    this.message = message;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.severity = this.determineSeverity(errorType);
    this.resolved = false;
  }

  determineSeverity(errorType) {
    const severityMap = {
      'critical': 'critical',
      'crash': 'critical',
      'exception': 'high',
      'error': 'high',
      'warning': 'medium',
      'info': 'low'
    };
    return severityMap[errorType.toLowerCase()] || 'medium';
  }

  markResolved() {
    this.resolved = true;
    this.resolvedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      errorId: this.errorId,
      pcId: this.pcId,
      pcName: this.pcName,
      errorType: this.errorType,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      severity: this.severity,
      resolved: this.resolved,
      resolvedAt: this.resolvedAt
    };
  }

  static createFromData(data) {
    const error = new Error(data.pcId, data.pcName, data.errorType, data.message, data.details);
    Object.assign(error, data);
    return error;
  }
}

module.exports = Error;
