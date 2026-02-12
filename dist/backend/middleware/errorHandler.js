const logger = require('../utils/logger');

/**
 * Error Handler Middleware
 * Centralized error handling
 */
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
}

/**
 * 404 Handler Middleware
 * Handles 404 errors
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route ${req.method} ${req.url} not found`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
