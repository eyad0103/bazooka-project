const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ErrorMonitor extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.knownErrors = new Map();
    this.errorCounts = new Map();
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupErrorHandlers();
    this.startPeriodicCheck();
    
    this.emit('started');
  }

  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.emit('stopped');
  }

  setupErrorHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleError('uncaught_exception', error.message, {
        stack: error.stack,
        type: 'critical'
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleError('unhandled_rejection', reason, {
        promise: promise.toString(),
        type: 'critical'
      });
    });

    // Monitor system signals
    process.on('SIGTERM', () => {
      this.handleError('system_signal', 'SIGTERM received', {
        type: 'info'
      });
    });

    process.on('SIGINT', () => {
      this.handleError('system_signal', 'SIGINT received', {
        type: 'info'
      });
    });
  }

  startPeriodicCheck() {
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.errorCheckInterval);
  }

  performHealthCheck() {
    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (memoryUsagePercent > 90) {
        this.handleError('memory_warning', 'High memory usage detected', {
          usage: memoryUsagePercent,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          type: 'warning'
        });
      }

      // Check disk space for logs
      this.checkDiskSpace();

      // Check for common application errors
      this.checkApplicationErrors();

    } catch (error) {
      this.handleError('health_check_error', error.message, {
        stack: error.stack,
        type: 'error'
      });
    }
  }

  checkDiskSpace() {
    try {
      const logDir = path.dirname(this.config.logFile || 'logs/agent.log');
      const stats = fs.statSync(logDir);
      
      // Simple check - in production, you'd want more sophisticated disk space checking
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        this.handleError('disk_space', 'Log directory getting large', {
          size: stats.size,
          path: logDir,
          type: 'warning'
        });
      }
    } catch (error) {
      // Ignore disk space check errors
    }
  }

  checkApplicationErrors() {
    // Check for common application crash patterns
    const commonErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EACCES',
      'EPERM'
    ];

    // Monitor for these errors in recent activity
    // This is a simplified implementation
    // In production, you'd monitor actual application logs
  }

  handleError(errorType, message, details = {}) {
    const errorId = this.generateErrorId(errorType, message);
    const timestamp = new Date().toISOString();
    
    const errorData = {
      errorId,
      errorType,
      message,
      timestamp,
      details: {
        ...details,
        pcId: this.config.pcId,
        agentVersion: this.config.version || '2.0.0'
      }
    };

    // Track error frequency
    const count = this.errorCounts.get(errorId) || 0;
    this.errorCounts.set(errorId, count + 1);

    // Only emit if this is a new error or hasn't been seen recently
    const lastSeen = this.knownErrors.get(errorId);
    const now = Date.now();
    
    if (!lastSeen || (now - lastSeen) > 60000) { // 1 minute cooldown
      this.knownErrors.set(errorId, now);
      this.emit('error', errorData);
    }

    // Log locally
    this.logError(errorData);
  }

  generateErrorId(errorType, message) {
    const hash = require('crypto')
      .createHash('md5')
      .update(`${errorType}:${message}`)
      .digest('hex')
      .substring(0, 8);
    
    return `${errorType}_${hash}`;
  }

  logError(errorData) {
    const logMessage = `[${errorData.timestamp}] ${errorData.errorType.toUpperCase()}: ${errorData.message}`;
    
    try {
      const logFile = this.config.logFile || 'logs/agent.log';
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Manual error reporting
  reportError(errorType, message, details = {}) {
    this.handleError(errorType, message, details);
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByType: {},
      recentErrors: []
    };

    for (const [errorId, count] of this.errorCounts.entries()) {
      stats.totalErrors += count;
      const errorType = errorId.split('_')[0];
      stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + count;
    }

    return stats;
  }
}

module.exports = ErrorMonitor;
