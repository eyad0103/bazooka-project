const express = require('express');
const router = express.Router();
const Error = require('../models/Error');
const db = require('../utils/db');
const logger = require('../utils/logger');

// Report error (agent endpoint)
router.post('/report', async (req, res) => {
  try {
    const { pcId, pcName, errorType, message, details } = req.body;

    if (!pcId || !errorType || !message) {
      return res.status(400).json({ 
        error: 'PC ID, error type, and message are required' 
      });
    }

    const error = new Error(pcId, pcName, errorType, message, details);
    await db.saveError(error.toJSON());

    logger.info('Error reported', { 
      errorId: error.errorId, 
      pcId, 
      errorType, 
      message 
    });

    res.json({
      success: true,
      errorId: error.errorId,
      message: 'Error reported successfully'
    });

  } catch (error) {
    logger.error('Error reporting failed', { error: error.message });
    res.status(500).json({ error: 'Failed to report error' });
  }
});

// Get all errors (owner dashboard)
router.get('/', async (req, res) => {
  try {
    const { pcId, severity, resolved } = req.query;
    let errors = await db.getErrors(pcId);

    // Apply filters
    if (severity) {
      errors = errors.filter(error => error.severity === severity);
    }

    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      errors = errors.filter(error => error.resolved === isResolved);
    }

    res.json({
      success: true,
      errors,
      total: errors.length,
      filters: { pcId, severity, resolved }
    });

  } catch (error) {
    logger.error('Failed to get errors', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve errors' });
  }
});

// Get single error details
router.get('/:errorId', async (req, res) => {
  try {
    const { errorId } = req.params;
    const errors = await db.getErrors();
    const error = errors.find(e => e.errorId === errorId);

    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }

    res.json({
      success: true,
      error
    });

  } catch (error) {
    logger.error('Failed to get error details', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve error details' });
  }
});

// Mark error as resolved (owner dashboard)
router.put('/:errorId/resolve', async (req, res) => {
  try {
    const { errorId } = req.params;
    const errors = await db.getErrors();
    const errorIndex = errors.findIndex(e => e.errorId === errorId);

    if (errorIndex === -1) {
      return res.status(404).json({ error: 'Error not found' });
    }

    const error = errors[errorIndex];
    error.resolved = true;
    error.resolvedAt = new Date().toISOString();

    // Update in database
    await db.saveError(error);

    logger.info('Error resolved', { errorId, pcId: error.pcId });

    res.json({
      success: true,
      errorId,
      resolvedAt: error.resolvedAt,
      message: 'Error marked as resolved'
    });

  } catch (error) {
    logger.error('Failed to resolve error', { error: error.message });
    res.status(500).json({ error: 'Failed to resolve error' });
  }
});

module.exports = router;
