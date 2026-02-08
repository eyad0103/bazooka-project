const express = require('express');
const router = express.Router();
const aiService = require('../ai/aiService');
const logger = require('../utils/logger');

// POST /api/settings/api-key - Save API key
router.post('/api-key', async (req, res) => {
  try {
    const { key, description } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    const result = await aiService.saveApiKey(key, description);
    
    res.json(result);

  } catch (error) {
    logger.error('Failed to save API key', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save API key'
    });
  }
});

// POST /api/settings/api-key/test - Test API key
router.post('/api-key/test', async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    const result = await aiService.testApiKey(key);
    
    res.json(result);

  } catch (error) {
    logger.error('Failed to test API key', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test API key'
    });
  }
});

// DELETE /api/settings/api-key - Delete API key
router.delete('/api-key', async (req, res) => {
  try {
    const result = await aiService.deleteApiKey();
    
    res.json(result);

  } catch (error) {
    logger.error('Failed to delete API key', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete API key'
    });
  }
});

module.exports = router;
