const logger = require('../utils/logger.util');
const errorCodes = require('../utils/errorCodes.util');

/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */
class ErrorMiddleware {
  /**
   * Global error handler
   */
  handle(error, req, res, next) {
    // Log the error
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Format error for response
    const formattedError = errorCodes.formatError(error);

    // Determine status code based on error type
    let statusCode = 500;
    
    if (error.code === errorCodes.codes.NOT_FOUND) {
      statusCode = 404;
    } else if (error.code === errorCodes.codes.VALIDATION_ERROR) {
      statusCode = 400;
    } else if (error.code === errorCodes.codes.UNAUTHORIZED) {
      statusCode = 401;
    } else if (error.code === errorCodes.codes.FORBIDDEN) {
      statusCode = 403;
    } else if (error.code === errorCodes.codes.CONFLICT) {
      statusCode = 409;
    } else if (error.code === errorCodes.codes.RATE_LIMITED) {
      statusCode = 429;
    } else if (error.code === errorCodes.codes.SERVICE_UNAVAILABLE) {
      statusCode = 503;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
    } else if (error.name === 'CastError') {
      statusCode = 400;
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      statusCode = 500;
    }

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: formattedError,
      timestamp: new Date().toISOString(),
      path: req.url
    });
  }

  /**
   * 404 handler
   */
  notFound(req, res) {
    const error = errorCodes.createError('NOT_FOUND', `Route ${req.method} ${req.url} not found`);
    this.handle(error, req, res);
  }

  /**
   * Async error wrapper
   */
  asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Validation error handler
   */
  validationError(errors) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = Array.isArray(errors) ? errors : [errors];
    error.code = errorCodes.codes.VALIDATION_ERROR;
    return error;
  }

  /**
   * Database error handler
   */
  databaseError(error) {
    logger.error('Database error', { error: error.message, stack: error.stack });
    
    if (error.code === 'ENOENT') {
      return errorCodes.createError('STORAGE_READ_FAILED', 'Database file not found');
    } else if (error.code === 'EACCES') {
      return errorCodes.createError('STORAGE_PERMISSION_DENIED', 'Database access denied');
    } else if (error.code === 'ENOSPC') {
      return errorCodes.createError('STORAGE_FULL', 'Database storage full');
    } else {
      return errorCodes.createError('STORAGE_WRITE_FAILED', 'Database operation failed');
    }
  }

  /**
   * Network error handler
   */
  networkError(error) {
    logger.error('Network error', { error: error.message, stack: error.stack });
    
    if (error.code === 'ECONNREFUSED') {
      return errorCodes.createError('CONNECTION_REFUSED', 'Connection refused');
    } else if (error.code === 'ETIMEDOUT') {
      return errorCodes.createError('CONNECTION_TIMEOUT', 'Connection timeout');
    } else if (error.code === 'ENOTFOUND') {
      return errorCodes.createError('DNS_RESOLUTION_FAILED', 'DNS resolution failed');
    } else {
      return errorCodes.createError('NETWORK_ERROR', 'Network error occurred');
    }
  }

  /**
   * Authentication error handler
   */
  authError(message = 'Authentication failed') {
    const error = new Error(message);
    error.code = errorCodes.codes.AUTHENTICATION_FAILED;
    error.name = 'AuthenticationError';
    return error;
  }

  /**
   * Authorization error handler
   */
  authzError(message = 'Access denied') {
    const error = new Error(message);
    error.code = errorCodes.codes.FORBIDDEN;
    error.name = 'AuthorizationError';
    return error;
  }

  /**
   * Rate limit error handler
   */
  rateLimitError(message = 'Rate limit exceeded') {
    const error = new Error(message);
    error.code = errorCodes.codes.RATE_LIMITED;
    error.name = 'RateLimitError';
    return error;
  }

  /**
   * Service unavailable error handler
   */
  serviceUnavailableError(message = 'Service temporarily unavailable') {
    const error = new Error(message);
    error.code = errorCodes.codes.SERVICE_UNAVAILABLE;
    error.name = 'ServiceUnavailableError';
    return error;
  }

  /**
   * Timeout error handler
   */
  timeoutError(message = 'Request timeout') {
    const error = new Error(message);
    error.code = errorCodes.codes.TIMEOUT;
    error.name = 'TimeoutError';
    return error;
  }

  /**
   * Custom error handler
   */
  customError(codeName, message) {
    return errorCodes.createError(codeName, message);
  }
}

module.exports = new ErrorMiddleware();
