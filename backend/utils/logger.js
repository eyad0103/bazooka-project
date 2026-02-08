const config = require('../config/serverConfig');

class Logger {
  constructor() {
    this.isDevelopment = config.nodeEnv === 'development';
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (this.isDevelopment) {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
    } else {
      // In production, you might want to use a proper logging service
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      this.log('debug', message, meta);
    }
  }
}

module.exports = new Logger();
