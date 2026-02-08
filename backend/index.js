const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

// Database setup
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bazooka-monitoring';

// Database connection
let db;
let pcsCollection;
let errorsCollection;
let appsCollection;
let settingsCollection;

// Initialize database connection
async function initializeDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    
    // Create collections with indexes
    pcsCollection = db.collection('pcs');
    errorsCollection = db.collection('errors');
    appsCollection = db.collection('apps');
    settingsCollection = db.collection('settings');
    
    // Create indexes for performance
    await pcsCollection.createIndex({ apiKey: 1 }, { unique: true });
    await pcsCollection.createIndex({ lastHeartbeat: 1 });
    await errorsCollection.createIndex({ timestamp: -1 });
    await errorsCollection.createIndex({ pcId: 1 });
    await appsCollection.createIndex({ pcId: 1 });
    await appsCollection.createIndex({ lastUpdated: -1 });
    
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for app data
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// In-memory cache for performance (fallback)
const pcsCache = new Map();
const errorsCache = new Map();
const appsCache = new Map();

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
app.post('/register-pc', async (req, res) => {
  const { pcName } = req.body;
  
  if (!pcName) {
    return res.status(400).json({ error: 'PC name is required' });
  }

  try {
    const apiKey = uuidv4();
    const pcId = uuidv4();
    const now = new Date();
    
    const pcData = {
      _id: new ObjectId(),
      id: pcId,
      name: pcName,
      apiKey: apiKey,
      registrationDate: now,
      lastHeartbeat: now,
      status: 'ONLINE',
      cpu: 0,
      memory: 0,
      platform: null,
      os: null,
      uptime: 0,
      createdAt: now,
      updatedAt: now
    };
    
    await pcsCollection.insertOne(pcData);
    
    // Update cache
    pcsCache.set(apiKey, pcData);
    
    console.log(`✅ PC registered: ${pcName} (${pcId})`);
    
    res.status(201).json({
      message: 'PC registered successfully',
      pcId: pcId,
      apiKey: apiKey,
      pcName: pcName,
      registrationDate: pcData.registrationDate
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'PC name already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register PC' });
  }
});

// Heartbeat endpoint
app.post('/heartbeat', async (req, res) => {
  const { apiKey, status, cpu, memory, timestamp, uptime, platform, os } = req.body;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const updateData = {
      lastHeartbeat: new Date(timestamp || Date.now()),
      status: status || 'ONLINE',
      cpu: cpu || 0,
      memory: memory || 0,
      uptime: uptime || 0,
      platform: platform || null,
      os: os || null,
      updatedAt: new Date()
    };
    
    const result = await pcsCollection.updateOne(
      { apiKey: apiKey },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'PC not found' });
    }
    
    // Update cache
    const cachedPC = pcsCache.get(apiKey);
    if (cachedPC) {
      Object.assign(cachedPC, updateData);
    }
    
    console.log(`💓 Heartbeat received for PC: ${apiKey}`);
    
    res.json({
      message: 'Heartbeat received successfully',
      timestamp: updateData.lastHeartbeat,
      status: updateData.status
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

// Error reporting endpoint
app.post('/report-error', async (req, res) => {
  const { apiKey, errorType, message, details } = req.body;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    // Find PC by API key
    const pc = await pcsCollection.findOne({ apiKey: apiKey });
    if (!pc) {
      return res.status(404).json({ error: 'PC not found' });
    }

    const errorData = {
      _id: new ObjectId(),
      pcId: pc.id,
      pcName: pc.name,
      type: errorType || 'ERROR',
      message: message || 'Unknown error',
      details: details || null,
      timestamp: new Date(),
      resolved: false,
      createdAt: new Date()
    };
    
    await errorsCollection.insertOne(errorData);
    
    console.log(`⚠️ Error reported for PC ${pc.name}: ${errorType} - ${message}`);
    
    res.status(201).json({
      message: 'Error reported successfully',
      errorId: errorData._id.toString(),
      timestamp: errorData.timestamp
    });
  } catch (error) {
    console.error('Error reporting error:', error);
    res.status(500).json({ error: 'Failed to report error' });
  }
});

// Get Errors
app.get('/errors', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const pcId = req.query.pcId;
  
  try {
    let query = {};
    if (pcId) {
      query.pcId = pcId;
    }
    
    const errors = await errorsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    res.json({
      errors: errors,
      total: await errorsCollection.countDocuments(query)
    });
  } catch (error) {
    console.error('Error fetching errors:', error);
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

// Get all PCs
app.get('/pcs', async (req, res) => {
  try {
    const pcs = await pcsCollection.find().sort({ lastHeartbeat: -1 }).toArray();
    
    const pcList = pcs.map(pc => ({
      id: pc.id,
      name: pc.name,
      status: pc.status,
      cpu: pc.cpu || 0,
      memory: pc.memory || 0,
      registrationDate: pc.registrationDate,
      lastHeartbeat: pc.lastHeartbeat,
      platform: pc.platform,
      os: pc.os,
      uptime: pc.uptime || 0
    }));
    
    res.json({
      pcs: pcList,
      total: pcList.length
    });
  } catch (error) {
    console.error('Error fetching PCs:', error);
    res.status(500).json({ error: 'Failed to fetch PCs' });
  }
});

// Application Status endpoints
app.post('/apps-status', async (req, res) => {
  const { apiKey, applications } = req.body;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  if (!applications || !Array.isArray(applications)) {
    return res.status(400).json({ error: 'Applications array is required' });
  }

  try {
    // Find PC by API key
    const pc = await pcsCollection.findOne({ apiKey: apiKey });
    if (!pc) {
      return res.status(404).json({ error: 'PC not found' });
    }

    const timestamp = new Date();
    
    // Delete existing apps for this PC
    await appsCollection.deleteMany({ pcId: pc.id });
    
    // Insert new apps
    const appDocuments = applications.map(app => ({
      _id: new ObjectId(),
      pcId: pc.id,
      pcName: pc.name,
      name: app.name,
      status: app.status || 'UNKNOWN',
      version: app.version || null,
      memoryUsage: app.memoryUsage || null,
      cpuUsage: app.cpuUsage || null,
      pid: app.pid || null,
      command: app.command || null,
      lastUpdated: timestamp,
      createdAt: timestamp
    }));
    
    if (appDocuments.length > 0) {
      await appsCollection.insertMany(appDocuments);
    }
    
    console.log(`📱 Apps updated for PC ${pc.name}: ${appDocuments.length} applications`);
    
    res.json({
      message: 'Application status updated successfully',
      pcName: pc.name,
      appsUpdated: appDocuments.length,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Apps status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

app.get('/apps-status', async (req, res) => {
  const { pcId } = req.query;
  const limit = parseInt(req.query.limit) || 100;
  
  try {
    let query = {};
    if (pcId) {
      query.pcId = pcId;
    }
    
    const apps = await appsCollection
      .find(query)
      .sort({ lastUpdated: -1 })
      .limit(limit)
      .toArray();
    
    res.json({
      apps: apps,
      total: await appsCollection.countDocuments(query),
      filteredByPc: pcId || null
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Settings endpoint
app.post('/api/settings', async (req, res) => {
  const settings = req.body;
  
  try {
    const settingsData = {
      ...settings,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    
    await settingsCollection.replaceOne(
      { type: 'global' },
      { ...settingsData, type: 'global' },
      { upsert: true }
    );
    
    console.log('⚙️ Settings updated:', settings);
    
    res.json({
      message: 'Settings saved successfully',
      received: settings,
      timestamp: settingsData.updatedAt
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await settingsCollection.findOne({ type: 'global' });
    
    const defaultSettings = {
      refreshRate: 5,
      alertThreshold: 'medium',
      theme: 'futuristic',
      animations: true
    };
    
    res.json(settings || defaultSettings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Bazooka PC Monitoring Backend started on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`💾 Database: Connected`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
