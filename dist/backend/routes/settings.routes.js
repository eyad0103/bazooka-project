const express = require('express');
const SettingsController = require('../controllers/settings.controller');
const router = express.Router();

/**
 * Settings Routes
 * Handle all settings-related endpoints (API Key management)
 */

// GET /api/settings/api-key - Get API key status
router.get('/api-key', SettingsController.getApiKeyStatus);

// POST /api/settings/api-key - Save API key
router.post('/api-key', SettingsController.saveApiKey);

// DELETE /api/settings/api-key - Delete API key
router.delete('/api-key', SettingsController.deleteApiKey);

// POST /api/settings/api-key/test - Test API key
router.post('/api-key/test', SettingsController.testApiKey);

module.exports = router;
