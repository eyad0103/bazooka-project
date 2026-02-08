const axios = require('axios');
const config = require('../config/serverConfig');
const logger = require('../utils/logger');

class OpenRouterClient {
  constructor() {
    this.baseUrl = config.openrouter.baseUrl;
    this.model = config.openrouter.model;
    this.maxTokens = config.openrouter.maxTokens;
    this.temperature = config.openrouter.temperature;
  }

  async chatWithAI(apiKey, messages) {
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful PC monitoring AI assistant. Provide clear, actionable advice about PC monitoring and troubleshooting.'
          },
          ...messages
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Bazooka PC Monitoring System'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenRouter API call failed', { 
        error: error.message,
        status: error.response?.status
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key');
      } else if (error.response?.status === 429) {
        throw new Error('OpenRouter API rate limit exceeded');
      } else if (error.response?.status >= 500) {
        throw new Error('OpenRouter API service unavailable');
      } else {
        throw new Error('Failed to get AI response');
      }
    }
  }

  async testApiKey(apiKey) {
    try {
      await this.chatWithAI(apiKey, [
        {
          role: 'user',
          content: 'Hello, this is a test message to verify the API key works.'
        }
      ]);
      
      return true;
    } catch (error) {
      if (error.message.includes('Invalid OpenRouter API key')) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = new OpenRouterClient();
