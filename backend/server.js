const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config/serverConfig');
const db = require('./utils/db');
const logger = require('./utils/logger');

// Import routes
const pcsRoutes = require('./routes/pcs');
const errorsRoutes = require('./routes/errors');
const aiRoutes = require('./routes/ai.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-hashes' 'sha256-VBUXQafYcXl3Nz8m7mCSqeYaCJlfBARp3Ps3fc/oOf4='"],
      scriptSrcAttr: ["'unsafe-hashes' 'sha256-VBUXQafYcXl3Nz8m7mCSqeYaCJlfBARp3Ps3fc/oOf4='"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://openrouter.ai"]
    },
  },
}));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API routes
app.use('/api/pcs', pcsRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.isConnected ? 'connected' : 'memory storage',
    environment: config.nodeEnv
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Bazooka PC Monitoring System',
    version: '2.0.0',
    description: 'Modular PC monitoring system with AI-powered error explanations',
    endpoints: {
      pcs: {
        'POST /api/pcs/register': 'Register/update PC (agent)',
        'GET /api/pcs': 'Get all PCs (dashboard)',
        'PUT /api/pcs/:pcId/rename': 'Rename PC (dashboard)',
        'GET /api/pcs/:pcId': 'Get PC details'
      },
      errors: {
        'POST /api/errors/report': 'Report error (agent)',
        'GET /api/errors': 'Get all errors (dashboard)',
        'GET /api/errors/:errorId': 'Get error details',
        'PUT /api/errors/:errorId/resolve': 'Mark error as resolved'
      },
      ai: {
        'POST /api/ai/explain_error': 'Get AI explanation for error',
        'POST /api/ai/chat': 'General AI chat'
      },
      apiKey: {
        'GET /api/api-key': 'Get API key status',
        'POST /api/api-key': 'Set/update API key',
        'POST /api/api-key/test': 'Test API key',
        'DELETE /api/api-key': 'Deactivate API key'
      }
    },
    features: [
      'Real-time PC monitoring',
      'Error reporting and tracking',
      'AI-powered error explanations',
      'Centralized API key management',
      'Modular architecture',
      'Memory fallback for database failures'
    ]
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();
    
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`, {
        environment: config.nodeEnv,
        database: db.isConnected ? 'MongoDB' : 'Memory Storage'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await db.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await db.disconnect();
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
