const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Import PC storage from pcs route (in production, this would be a database)
let pcsStorage;
try {
  // Try to get the pcs storage from the pcs route
  pcsStorage = require('./pcs').pcsStorage || new Map();
} catch (error) {
  pcsStorage = new Map();
}

// Audit log for key changes
const auditLog = [];

// Get all API keys (admin endpoint)
router.get('/', (req, res) => {
  const pcs = Array.from(pcsStorage.values()).map(pc => ({
    id: pc.id,
    name: pc.name,
    apiKey: pc.apiKey,
    status: pc.status,
    lastHeartbeat: pc.lastHeartbeat,
    registrationDate: pc.registeredAt,
    cpu: pc.cpu || 0,
    memory: pc.memory || 0
  }));
  
  res.json({
    keys: pcs,
    total: pcs.length,
    timestamp: new Date().toISOString()
  });
});

// Regenerate API key for a PC
router.post('/regenerate', (req, res) => {
  const { pcId } = req.body;
  
  if (!pcId) {
    return res.status(400).json({ error: 'PC ID is required' });
  }
  
  // Find PC by ID
  const pc = Array.from(pcsStorage.values()).find(p => p.id === pcId);
  if (!pc) {
    return res.status(404).json({ error: 'PC not found' });
  }
  
  const oldApiKey = pc.apiKey;
  const newApiKey = uuidv4();
  
  // Update API key
  pc.apiKey = newApiKey;
  
  // Update storage
  pcsStorage.delete(oldApiKey);
  pcsStorage.set(newApiKey, pc);
  
  // Add to audit log
  auditLog.push({
    action: 'regenerate',
    pcId: pc.id,
    pcName: pc.name,
    oldApiKey: oldApiKey.substring(0, 8) + '...',
    newApiKey: newApiKey.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
    ip: req.ip || 'unknown'
  });
  
  console.log(`🔄 API key regenerated for PC: ${pc.name}`);
  
  res.json({
    message: 'API key regenerated successfully',
    pcId: pc.id,
    pcName: pc.name,
    newApiKey: newApiKey,
    timestamp: new Date().toISOString()
  });
});

// Revoke API key for a PC
router.post('/revoke', (req, res) => {
  const { pcId } = req.body;
  
  if (!pcId) {
    return res.status(400).json({ error: 'PC ID is required' });
  }
  
  // Find PC by ID
  const pc = Array.from(pcsStorage.values()).find(p => p.id === pcId);
  if (!pc) {
    return res.status(404).json({ error: 'PC not found' });
  }
  
  const oldApiKey = pc.apiKey;
  
  // Remove from storage
  pcsStorage.delete(oldApiKey);
  
  // Add to audit log
  auditLog.push({
    action: 'revoke',
    pcId: pc.id,
    pcName: pc.name,
    apiKey: oldApiKey.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
    ip: req.ip || 'unknown'
  });
  
  console.log(`🚫 API key revoked for PC: ${pc.name}`);
  
  res.json({
    message: 'API key revoked successfully',
    pcId: pc.id,
    pcName: pc.name,
    timestamp: new Date().toISOString()
  });
});

// Get audit log
router.get('/audit', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  
  res.json({
    auditLog: auditLog.slice(-limit),
    total: auditLog.length,
    timestamp: new Date().toISOString()
  });
});

// Export API keys
router.get('/export', (req, res) => {
  const pcs = Array.from(pcsStorage.values()).map(pc => ({
    name: pc.name,
    apiKey: pc.apiKey,
    status: pc.status,
    lastHeartbeat: pc.lastHeartbeat,
    registrationDate: pc.registeredAt
  }));
  
  const csv = [
    'PC Name,API Key,Status,Last Heartbeat,Registration Date',
    ...pcs.map(pc => 
      `"${pc.name}","${pc.apiKey}","${pc.status}","${pc.lastHeartbeat || 'Never'}","${pc.registrationDate}"`
    )
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="api-keys-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

// Helper function to set pcs storage (called from pcs.js)
function setPcsStorage(storage) {
  pcsStorage = storage;
}

module.exports = {
  router,
  setPcsStorage
};
