const AIService = require('../services/ai.service');
const logger = require('../utils/logger');

/**
 * AI Controller
 * Handles AI HTTP requests
 */
class AIController {
  async chat(req, res) {
    try {
      const { message, errorContext } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const result = await AIService.chat(message, errorContext);
      
      if (result.success) {
        res.json({
          success: true,
          response: result.response
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('AI chat failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async explainError(req, res) {
    try {
      const { errorId } = req.params;
      
      if (!errorId) {
        return res.status(400).json({
          success: false,
          error: 'Error ID is required'
        });
      }

      const result = await AIService.explainError(errorId);
      
      if (result.success) {
        res.json({
          success: true,
          explanation: result.response
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('AI error explanation failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AIController();
