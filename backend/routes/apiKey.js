const express = require('express');
const router = express.Router();
const APIKey = require('../models/APIKey');
const db = require('../utils/db');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');

// Get API key status (owner dashboard)
router.get('/', async (req, res) => {
  try {
    const apiKeyData = await db.getAPIKey();
    
    if (!apiKeyData) {
      return res.json({
        success: true,
        hasKey: false,
        message: 'No API key configured'
      });
    }

    // Return only metadata, not the actual key
    res.json({
      success: true,
      hasKey: true,
      apiKey: {
        description: apiKeyData.description,
        createdAt: apiKeyData.createdAt,
        lastUsed: apiKeyData.lastUsed,
        isActive: apiKeyData.isActive,
        updatedAt: apiKeyData.updatedAt
      }
    });

  } catch (error) {
    logger.error('Failed to get API key status', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve API key status' });
  }
});

// Set/update API key (owner dashboard)
router.post('/', async (req, res) => {
  try {
    const { key, description } = req.body;

    if (!key || key.trim().length === 0) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate OpenRouter API key format
    if (!key.startsWith('sk-or-')) {
      return res.status(400).json({ 
        error: 'Invalid OpenRouter API key format. Key should start with "sk-or-"' 
      });
    }

    // Encrypt the key
    const encryptedKey = encryption.encrypt(key.trim());

    // Create or update API key
    const apiKey = new APIKey(encryptedKey, description?.trim());
    
    // If updating existing key, preserve some metadata
    const existingKey = await db.getAPIKey();
    if (existingKey) {
      apiKey.createdAt = existingKey.createdAt;
    }

    await db.saveAPIKey(apiKey.toJSON());

    logger.info('API key updated', { 
      description: description?.trim(),
      keyLength: key.length 
    });

    res.json({
      success: true,
      message: 'API key saved successfully',
      description: description?.trim(),
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to save API key', { error: error.message });
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Test API key
router.post('/test', async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'API key is required for testing' });
    }

    // Test the key with a simple OpenRouter API call
    const axios = require('axios');
    const config = require('../config/serverConfig');

    const response = await axios.get(`${config.openrouter.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    res.json({
      success: true,
      message: 'API key is valid',
      modelsAvailable: response.data.data?.length || 0
    });

  } catch (error) {
    logger.error('API key test failed', { error: error.message });
    
    if (error.response?.status === 401) {
      return res.status(400).json({ 
        error: 'Invalid API key',
        details: 'The provided API key is not valid or has been revoked'
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(400).json({ 
        error: 'Connection timeout',
        details: 'Could not connect to OpenRouter API. Please check your internet connection.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to test API key',
      details: error.message 
    });
  }
});

// Delete API key
router.delete('/', async (req, res) => {
  try {
    const apiKeyData = await db.getAPIKey();
    
    if (!apiKeyData) {
      return res.status(404).json({ error: 'No API key found' });
    }

    // Deactivate the key
    apiKeyData.deactivate();
    await db.saveAPIKey(apiKeyData.toJSON());

    logger.info('API key deactivated');

    res.json({
      success: true,
      message: 'API key deactivated successfully',
      deactivatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to deactivate API key', { error: error.message });
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

module.exports = router;
