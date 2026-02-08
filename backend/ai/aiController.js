const aiService = require('./aiService');
const logger = require('../utils/logger');

class AIController {
  // GET /api/ai/status - Check if API key is configured
  async getStatus(req, res) {
    try {
      const status = await aiService.isApiKeyConfigured();
      
      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      logger.error('Failed to get AI status', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to check AI status'
      });
    }
  }

  // POST /api/ai/chat - Chat with AI
  async chat(req, res) {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const response = await aiService.chatWithAI(message, context);
      
      res.json(response);

    } catch (error) {
      logger.error('AI chat failed', { error: error.message });
      
      if (error.message.includes('not configured')) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured',
          requiresApiKey: true
        });
      } else if (error.message.includes('Invalid OpenRouter API key')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OpenRouter API key',
          requiresApiKey: true
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get AI response'
        });
      }
    }
  }

  // POST /api/ai/explain-error - Explain an error
  async explainError(req, res) {
    try {
      const { errorId } = req.body;

      if (!errorId) {
        return res.status(400).json({
          success: false,
          error: 'Error ID is required'
        });
      }

      const response = await aiService.explainError(errorId);
      
      res.json(response);

    } catch (error) {
      logger.error('AI explanation failed', { error: error.message });
      
      if (error.message.includes('not configured')) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured',
          requiresApiKey: true
        });
      } else if (error.message.includes('Invalid OpenRouter API key')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OpenRouter API key',
          requiresApiKey: true
        });
      } else if (error.message.includes('Error not found')) {
        return res.status(404).json({
          success: false,
          error: 'Error not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to generate AI explanation'
        });
      }
    }
  }
}

module.exports = new AIController();
