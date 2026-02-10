const logger = require('../utils/logger.util');

/**
 * Request Logger Middleware
 * Logs all incoming HTTP requests
 */
class RequestLoggerMiddleware {
  constructor() {
    this.skipPaths = ['/health', '/favicon.ico'];
    this.sensitiveFields = ['password', 'token', 'key', 'secret'];
  }

  /**
   * Request logger middleware
   */
  log() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Store original res.end to capture response
      const originalEnd = res.end;
      
      res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);

        const responseTime = Date.now() - startTime;
        
        // Log the request
        if (!this.shouldSkipPath(req.path)) {
          this.logRequest(req, res, responseTime);
        }
      }.bind(this);

      next();
    };
  }

  /**
   * Check if path should be skipped
   */
  shouldSkipPath(path) {
    return this.skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  /**
   * Log request details
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: this.getClientIP(req),
      contentLength: req.get('Content-Length') || 0,
      referer: req.get('Referer') || null
    };

    // Add request ID if available
    if (req.requestId) {
      logData.requestId = req.requestId;
    }

    // Add user info if available
    if (req.user) {
      logData.userId = req.user.id;
      logData.userRole = req.user.role;
    }

    // Log sanitized request body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      const sanitizedBody = this.sanitizeRequestBody(req.body);
      if (sanitizedBody && Object.keys(sanitizedBody).length > 0) {
        logData.body = sanitizedBody;
      }
    }

    // Log query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }

    // Log headers (selective)
    const importantHeaders = this.getImportantHeaders(req);
    if (Object.keys(importantHeaders).length > 0) {
      logData.headers = importantHeaders;
    }

    // Determine log level based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (this.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeRequestBody(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get important headers for logging
   */
  getImportantHeaders(req) {
    const importantHeaders = [
      'content-type',
      'accept',
      'authorization',
      'x-request-id',
      'x-forwarded-for',
      'x-real-ip',
      'user-agent'
    ];

    const headers = {};
    
    for (const header of importantHeaders) {
      const value = req.get(header);
      if (value) {
        // Redact sensitive headers
        if (header.toLowerCase().includes('auth')) {
          headers[header] = '[REDACTED]';
        } else {
          headers[header] = value;
        }
      }
    }

    return headers;
  }

  /**
   * Enhanced logging for API endpoints
   */
  apiLog() {
    return (req, res, next) => {
      const startTime = Date.now();
      const originalEnd = res.end;
      
      res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);

        const responseTime = Date.now() - startTime;
        
        // Enhanced API logging
        this.logAPIRequest(req, res, responseTime);
      }.bind(this);

      next();
    };
  }

  /**
   * Log API request with enhanced details
   */
  logAPIRequest(req, res, responseTime) {
    const logData = {
      type: 'API_REQUEST',
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: this.getClientIP(req),
      timestamp: new Date().toISOString()
    };

    // Add API-specific details
    if (req.body) {
      logData.requestSize = JSON.stringify(req.body).length;
    }

    if (res.get('Content-Length')) {
      logData.responseSize = parseInt(res.get('Content-Length'));
    }

    // Add performance metrics
    if (responseTime > 1000) {
      logData.performanceWarning = 'slow_request';
    }

    logger.info('API Request', logData);
  }

  /**
   * Error logging middleware
   */
  errorLog() {
    return (error, req, res, next) => {
      const logData = {
        type: 'ERROR',
        method: req.method,
        url: req.url,
        path: req.path,
        ip: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      };

      // Add request body if available
      if (req.body) {
        logData.requestBody = this.sanitizeRequestBody(req.body);
      }

      logger.error('Request Error', logData);
      next(error);
    };
  }

  /**
   * Performance monitoring middleware
   */
  performanceLog() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const originalEnd = res.end;
      
      res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);

        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        this.logPerformance(req, res, responseTime);
      }.bind(this);

      next();
    };
  }

  /**
   * Log performance metrics
   */
  logPerformance(req, res, responseTime) {
    const logData = {
      type: 'PERFORMANCE',
      method: req.method,
      path: req.path,
      responseTime: `${responseTime.toFixed(2)}ms`,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    };

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow Request Detected', logData);
    } else {
      logger.debug('Request Performance', logData);
    }
  }
}

module.exports = new RequestLoggerMiddleware();
