const express = require('express');
const router = express.Router();
const PC = require('../models/PC');
const db = require('../utils/db');
const logger = require('../utils/logger');

// Register a new PC (agent endpoint)
router.post('/register', async (req, res) => {
  try {
    const { pcId, displayName, systemInfo } = req.body;

    if (!pcId) {
      return res.status(400).json({ error: 'PC ID is required' });
    }

    // Check if PC already exists
    let pc = await db.getPC(pcId);
    
    if (pc) {
      // Update existing PC
      pc.updateHeartbeat(systemInfo);
      await db.savePC(pc.toJSON());
      logger.info('PC heartbeat updated', { pcId, displayName: pc.displayName });
    } else {
      // Register new PC
      pc = new PC(pcId, displayName);
      pc.updateHeartbeat(systemInfo);
      await db.savePC(pc.toJSON());
      logger.info('New PC registered', { pcId, displayName });
    }

    res.json({
      success: true,
      pcId: pc.pcId,
      displayName: pc.displayName,
      status: pc.status,
      message: pc.displayName ? 'PC updated' : 'PC registered successfully'
    });

  } catch (error) {
    logger.error('PC registration error', { error: error.message });
    res.status(500).json({ error: 'Failed to register PC' });
  }
});

// Get all PCs (owner dashboard)
router.get('/', async (req, res) => {
  try {
    const pcs = await db.getAllPCs();
    
    // Check for offline PCs (no heartbeat for 2 minutes)
    const now = new Date();
    const updatedPCs = pcs.map(pc => {
      const lastSeen = new Date(pc.lastSeen);
      const timeDiff = now - lastSeen;
      
      if (timeDiff > 2 * 60 * 1000 && pc.status === 'online') {
        pc.status = 'offline';
        db.updatePC(pc.pcId, { status: 'offline' });
      }
      
      return pc;
    });

    res.json({
      success: true,
      pcs: updatedPCs,
      total: updatedPCs.length
    });

  } catch (error) {
    logger.error('Failed to get PCs', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve PCs' });
  }
});

// Rename PC
router.put('/:pcId/rename', async (req, res) => {
  try {
    const { pcId } = req.params;
    const { displayName } = req.body;

    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const pc = await db.getPC(pcId);
    if (!pc) {
      return res.status(404).json({ error: 'PC not found' });
    }

    const oldName = pc.displayName;
    pc.rename(displayName.trim());
    await db.savePC(pc.toJSON());

    logger.info('PC renamed', { pcId, oldName, newName: displayName.trim() });

    res.json({
      success: true,
      pcId: pc.pcId,
      oldName,
      newName: displayName.trim(),
      message: 'PC renamed successfully'
    });

  } catch (error) {
    logger.error('PC rename error', { error: error.message });
    res.status(500).json({ error: 'Failed to rename PC' });
  }
});

// Get single PC details
router.get('/:pcId', async (req, res) => {
  try {
    const { pcId } = req.params;
    const pc = await db.getPC(pcId);

    if (!pc) {
      return res.status(404).json({ error: 'PC not found' });
    }

    res.json({
      success: true,
      pc
    });

  } catch (error) {
    logger.error('Failed to get PC details', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve PC details' });
  }
});

// Heartbeat endpoint (for agent updates)
router.post('/heartbeat', async (req, res) => {
  try {
    const { pcId, systemInfo } = req.body;
    
    if (!pcId) {
      return res.status(400).json({ error: 'PC ID is required' });
    }
    
    // Check if PC exists
    let pc = await db.getPC(pcId);
    
    if (pc) {
      // Update existing PC
      pc.updateHeartbeat(systemInfo);
      await db.savePC(pc.toJSON());
      logger.info('PC heartbeat updated', { pcId, displayName: pc.displayName });
      
      res.json({
        success: true,
        pcId: pc.pcId,
        displayName: pc.displayName,
        status: pc.status,
        message: 'Heartbeat received'
      });
    } else {
      return res.status(404).json({ error: 'PC not found' });
    }
  } catch (error) {
    logger.error('Heartbeat error', { error: error.message });
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

module.exports = router;
