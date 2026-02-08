const express = require('express');
const router = express.Router();
const App = require('../models/App');

// In-memory storage
const apps = new Map();

// Update app status for PC
router.post('/', async (req, res) => {
  const { apiKey, apps: appList } = req.body;
  
  if (!apiKey || !appList) {
    return res.status(400).json({ error: 'API key and apps list are required' });
  }
  
  const timestamp = new Date();
  const appDocuments = [];
  
  // Clear existing apps for this PC
  for (const [appId, app] of apps.entries()) {
    if (app.pcId === apiKey) {
      apps.delete(appId);
    }
  }
  
  // Add new apps
  appList.forEach(appData => {
    const app = new App(
      apiKey,
      appData.pcName || 'Unknown PC',
      appData.name,
      appData.status,
      appData.version
    );
    
    app.memoryUsage = appData.memoryUsage || '0 MB';
    app.cpuUsage = appData.cpuUsage || '0%';
    app.lastUpdated = timestamp;
    
    apps.set(app.id, app);
    appDocuments.push(app);
  });
  
  console.log(`📱 Apps updated: ${appDocuments.length} applications`);
  
  res.json({
    message: 'Application status updated successfully',
    appsUpdated: appDocuments.length,
    timestamp: timestamp
  });
});

// Get all apps
router.get('/', (req, res) => {
  const appsArray = Array.from(apps.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  
  res.json({
    apps: appsArray,
    total: appsArray.length
  });
});

// Get apps by PC
router.get('/pc/:pcId', (req, res) => {
  const { pcId } = req.params;
  const pcApps = Array.from(apps.values())
    .filter(app => app.pcId === pcId)
    .sort((a, b) => b.lastUpdated - a.lastUpdated);
  
  res.json({
    apps: pcApps,
    total: pcApps.length
  });
});

module.exports = router;
