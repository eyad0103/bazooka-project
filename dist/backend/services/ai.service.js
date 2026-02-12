const ApiKeyModel = require('../db/apiKey.model');
const { withTimeout } = require('../utils/timeout');
const logger = require('../utils/logger');

/**
 * AI Service
 * 🔥 ONLY place OpenRouter is used
 * Handles all AI communication
 */
class AIService {
  constructor() {
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.timeout = 30000; // 30 seconds
  }

  async validateApiKey(apiKey) {
    try {
      const response = await withTimeout(
        fetch(`${this.openRouterUrl}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bazooka-pc-monitor.com',
            'X-Title': 'Bazooka PC Monitor'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.2-3b-instruct:free',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          })
        }),
        this.timeout
      );

      if (!response.ok) {
        throw new Error(`API key validation failed: ${response.status}`);
      }

      return { valid: true };
    } catch (error) {
      logger.error('API key validation failed', { error: error.message });
      return { valid: false, error: error.message };
    }
  }

  async chat(message, errorContext = null) {
    try {
      // Get stored API key
      const keyData = await ApiKeyModel.get();
      if (!keyData) {
        throw new Error('No API key configured');
      }

      // Update last used timestamp
      await ApiKeyModel.updateLastUsed();

      // Prepare messages
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for the Bazooka PC Monitoring System. Provide clear, concise answers about PC monitoring, errors, and system issues.'
        }
      ];

      // Add error context if provided
      if (errorContext) {
        messages.push({
          role: 'user',
          content: `Error Context: ${JSON.stringify(errorContext)}\n\nUser Question: ${message}`
        });
      } else {
        messages.push({
          role: 'user',
          content: message
        });
      }

      const response = await withTimeout(
        fetch(this.openRouterUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keyData.key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bazooka-pc-monitor.com',
            'X-Title': 'Bazooka PC Monitor'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.2-3b-instruct:free',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
          })
        }),
        this.timeout
      );

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'No response received';

      logger.info('AI chat completed', { messageLength: aiResponse.length });
      return {
        success: true,
        response: aiResponse
      };

    } catch (error) {
      logger.error('AI chat failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async explainError(errorId) {
    try {
      // Get error details (this would need error model import)
      // For now, use the error context provided
      const result = await this.chat(
        'Explain this error and suggest solutions:',
        { errorId }
      );

      return result;
    } catch (error) {
      logger.error('Error explanation failed', { errorId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();
