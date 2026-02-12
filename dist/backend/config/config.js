/**
 * Application Configuration
 * Centralized configuration management
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
  },

  // Database configuration
  database: {
    storagePath: process.env.STORAGE_PATH || './storage'
  },

  // AI configuration
  ai: {
    timeout: parseInt(process.env.AI_TIMEOUT) || 30000,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 500,
    model: process.env.AI_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'
  },

  // Security configuration
  security: {
    encryptionPassword: process.env.ENCRYPTION_PASSWORD || 'default-key-12345',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
