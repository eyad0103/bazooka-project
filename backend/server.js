const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const pcsRoutes = require('./routes/pcs');
const heartbeatRoutes = require('./routes/heartbeat');
const errorsRoutes = require('./routes/errors');
const appsRoutes = require('./routes/apps');
const aiChatRoutes = require('./routes/ai-chat');
const apiKeysRoutes = require('./routes/api-keys');

// Initialize shared storage
apiKeysRoutes.setPcsStorage(pcsRoutes.pcsStorage);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/pcs', pcsRoutes);
app.use('/heartbeat', heartbeatRoutes);
app.use('/errors', errorsRoutes);
app.use('/apps-status', appsRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/keys', apiKeysRoutes.router);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'BAZOOKA PC MONITORING SYSTEM',
    version: '1.0.0',
    endpoints: [
      'GET /',
      'GET /api',
      'POST /pcs',
      'GET /pcs',
      'POST /heartbeat',
      'POST /errors',
      'GET /errors',
      'POST /apps-status',
      'GET /apps-status',
      'POST /api/ai-chat',
      'GET /api/ai-chat',
      'DELETE /api/ai-chat',
      'GET /api/keys',
      'POST /api/keys/regenerate',
      'POST /api/keys/revoke',
      'GET /api/keys/audit',
      'GET /api/keys/export'
    ],
    features: [
      'Real-time PC Monitoring',
      'Heartbeat Tracking',
      'Error Reporting',
      'Application Monitoring',
      'AI Chat Assistant',
      'API Key Management',
      'Futuristic Dashboard'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bazooka PC Monitoring Backend running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
