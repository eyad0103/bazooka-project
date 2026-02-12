/**
 * Simple Logger Utility
 * Handles application logging
 */

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message, meta) {
    if (this.logLevel === 'debug') {
      this.log('debug', message, meta);
    }
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  error(message, meta) {
    this.log('error', message, meta);
  }
}

module.exports = new Logger();
