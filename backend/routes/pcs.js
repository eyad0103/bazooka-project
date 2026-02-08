const express = require('express');
const router = express.Router();
const PC = require('../models/PC');

// In-memory storage (replace with database in production)
const pcs = new Map();

// Export storage for other routes
module.exports.pcsStorage = pcs;

// Register a new PC
router.post('/', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'PC name is required' });
  }
  
  // Check if PC already exists
  const existingPC = Array.from(pcs.values()).find(pc => pc.name === name);
  if (existingPC) {
    return res.status(409).json({ error: 'PC name already exists' });
  }
  
  const pc = new PC(name);
  pcs.set(pc.apiKey, pc);
  
  console.log(`✅ PC registered: ${name} (${pc.id})`);
  
  res.status(201).json({
    message: 'PC registered successfully',
    pcId: pc.id,
    apiKey: pc.apiKey,
    pcName: pc.name,
    registrationDate: pc.registeredAt
  });
});

// Get all PCs
router.get('/', (req, res) => {
  const pcsArray = Array.from(pcs.values()).map(pc => ({
    id: pc.id,
    name: pc.name,
    status: pc.status,
    cpu: pc.cpu,
    memory: pc.memory,
    lastHeartbeat: pc.lastHeartbeat,
    registrationDate: pc.registeredAt,
    uptime: pc.uptime
  }));
  
  res.json({
    pcs: pcsArray,
    total: pcsArray.length
  });
});

// Get PC by API key
router.get('/:apiKey', (req, res) => {
  const { apiKey } = req.params;
  const pc = pcs.get(apiKey);
  
  if (!pc) {
    return res.status(404).json({ error: 'PC not found' });
  }
  
  res.json(pc);
});

module.exports = router;
