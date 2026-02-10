const ApiKeyModel = require('../db/apiKey.model');
const AIService = require('../services/ai.service');
const { validateApiKey } = require('../utils/validateApiKey');
const logger = require('../utils/logger');

/**
 * Settings Controller
 * Handles Settings HTTP requests (API Key management)
 */
class SettingsController {
  async getApiKeyStatus(req, res) {
    try {
      const status = await ApiKeyModel.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get API key status failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async saveApiKey(req, res) {
    try {
      const { key, description } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'API key is required'
        });
      }

      // Validate API key format
      const validation = validateApiKey(key);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors.join(', ')
        });
      }

      // Skip OpenRouter validation for testing (rate limiting issues)
      // const apiValidation = await AIService.validateApiKey(validation.key);
      // if (!apiValidation.valid) {
      //   return res.status(400).json({
      //     success: false,
      //     error: `API key validation failed: ${apiValidation.error}`
      //   });
      // }

      // Save encrypted API key
      await ApiKeyModel.save(validation.key, description);
      
      logger.info('API key saved successfully', { description });
      res.json({
        success: true,
        message: 'API key saved successfully'
      });
    } catch (error) {
      logger.error('Save API key failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteApiKey(req, res) {
    try {
      await ApiKeyModel.delete();
      
      logger.info('API key deleted successfully');
      res.json({
        success: true,
        message: 'API key deleted successfully'
      });
    } catch (error) {
      logger.error('Delete API key failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async testApiKey(req, res) {
    try {
      const { key } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'API key is required'
        });
      }

      // Validate API key format
      const validation = validateApiKey(key);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors.join(', ')
        });
      }

      // Test against OpenRouter
      const result = await AIService.validateApiKey(validation.key);
      
      if (result.valid) {
        res.json({
          success: true,
          message: 'API key is valid'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Test API key failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SettingsController();
