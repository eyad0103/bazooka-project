#!/usr/bin/env node

/**
 * Bazooka PC Monitoring System - Server Entry Point
 * Single responsibility: Start the application server
 */

const app = require('./app');
const config = require('./config/serverConfig');
const logger = require('./utils/logger.util');

// Start server
const server = app.listen(config.port, config.host, () => {
  logger.info(`🚀 Bazooka PC Monitoring System started`, {
    port: config.port,
    host: config.host,
    environment: config.nodeEnv,
    pid: process.pid
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = server;
