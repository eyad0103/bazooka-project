const express = require('express');
const router = express.Router();
const PC = require('../models/PC');

// In-memory storage (shared with pcs.js)
const pcs = require('../routes/pcs').pcs || new Map();

// Receive heartbeat from PC
router.post('/', async (req, res) => {
  const { apiKey, status, cpu, memory, uptime } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }
  
  const pc = pcs.get(apiKey);
  if (!pc) {
    return res.status(404).json({ error: 'Invalid API key' });
  }
  
  // Update PC status and metrics
  pc.status = status || 'ONLINE';
  pc.cpu = cpu || 0;
  pc.memory = memory || 0;
  pc.uptime = uptime || 0;
  pc.lastHeartbeat = new Date();
  
  console.log(`💓 Heartbeat received for PC: ${pc.name}`);
  
  res.json({
    message: 'Heartbeat received successfully',
    timestamp: pc.lastHeartbeat,
    status: pc.status
  });
});

module.exports = router;
