const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory storage (for now)
const pcs = new Map();
const errors = [];
const apps = new Map(); // Store apps per PC

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/api', (req, res) => {
  res.json({
    message: 'BAZOOKA PC MONITORING SYSTEM',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /',
      'GET /api',
      'POST /register-pc',
      'POST /heartbeat',
      'POST /report-error',
      'GET /errors',
      'GET /pcs',
      'POST /apps-status',
      'GET /apps-status',
      'GET /api/settings',
      'POST /api/settings'
    ]
  });
});

// PC Registration
app.post('/register-pc', (req, res) => {
  const { pcName } = req.body;
  
  if (!pcName) {
    return res.status(400).json({ error: 'PC name is required' });
  }

  const apiKey = uuidv4();
  const pc = {
    id: uuidv4(),
    name: pcName,
    apiKey: apiKey,
    registrationDate: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    status: 'ONLINE'
  };

  pcs.set(apiKey, pc);
  
  res.json({
    message: 'PC registered successfully',
    pc: {
      id: pc.id,
      name: pc.name,
      apiKey: pc.apiKey,
      registrationDate: pc.registrationDate
    }
  });
});

// Heartbeat
app.post('/heartbeat', (req, res) => {
  const { apiKey, status } = req.body;
  
  if (!apiKey || !pcs.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const pc = pcs.get(apiKey);
  pc.lastHeartbeat = new Date().toISOString();
  pc.status = status || 'ONLINE';
  
  res.json({ message: 'Heartbeat received', status: pc.status });
});

// Error Reporting
app.post('/report-error', (req, res) => {
  const { apiKey, errorType, message } = req.body;
  
  if (!apiKey || !pcs.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const pc = pcs.get(apiKey);
  const error = {
    id: uuidv4(),
    pcId: pc.id,
    pcName: pc.name,
    errorType: errorType || 'UNKNOWN',
    message: message || 'No message provided',
    timestamp: new Date().toISOString()
  };

  errors.push(error);
  
  res.json({ message: 'Error reported successfully', errorId: error.id });
});

// Get Errors
app.get('/errors', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const recentErrors = errors.slice(-limit).reverse();
  
  res.json({
    errors: recentErrors,
    total: errors.length
  });
});

// Get all PCs
app.get('/pcs', (req, res) => {
  const pcList = Array.from(pcs.values()).map(pc => ({
    id: pc.id,
    name: pc.name,
    status: pc.status,
    registrationDate: pc.registrationDate,
    lastHeartbeat: pc.lastHeartbeat
  }));
  
  res.json({
    pcs: pcList,
    total: pcList.length
  });
});

// Application Status endpoints
app.post('/apps-status', (req, res) => {
  const { apiKey, applications } = req.body;
  
  if (!apiKey || !pcs.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!applications || !Array.isArray(applications)) {
    return res.status(400).json({ error: 'Applications array is required' });
  }

  const pc = pcs.get(apiKey);
  const timestamp = new Date().toISOString();
  
  // Store apps for this PC
  const pcApps = applications.map(app => ({
    id: uuidv4(),
    pcId: pc.id,
    pcName: pc.name,
    name: app.name,
    status: app.status || 'UNKNOWN', // RUNNING, NOT_RESPONDING, STOPPED, UNKNOWN
    version: app.version || null,
    memoryUsage: app.memoryUsage || null,
    cpuUsage: app.cpuUsage || null,
    lastUpdated: timestamp
  }));
  
  apps.set(pc.id, pcApps);
  
  res.json({
    message: 'Application status updated successfully',
    pcName: pc.name,
    appsUpdated: pcApps.length,
    timestamp
  });
});

app.get('/apps-status', (req, res) => {
  const { pcId } = req.query;
  
  let allApps = [];
  
  if (pcId) {
    // Return apps for specific PC
    const pcApps = apps.get(pcId) || [];
    allApps = pcApps;
  } else {
    // Return all apps for all PCs
    for (const pcApps of apps.values()) {
      allApps.push(...pcApps);
    }
  }
  
  // Sort by last updated
  allApps.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  
  res.json({
    apps: allApps,
    total: allApps.length,
    filteredByPc: pcId || null
  });
});

// Settings endpoint
app.post('/api/settings', (req, res) => {
  const settings = req.body;
  
  // In a real application, you might store settings in a database
  // For now, just acknowledge receipt
  console.log('Settings received:', settings);
  
  res.json({
    message: 'Settings saved successfully',
    received: settings
  });
});

app.get('/api/settings', (req, res) => {
  // Return default settings for now
  res.json({
    refreshRate: 5,
    alertThreshold: 'medium',
    theme: 'futuristic',
    animations: true
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BAZOOKA PC MONITORING SYSTEM running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}`);
});

module.exports = app;
