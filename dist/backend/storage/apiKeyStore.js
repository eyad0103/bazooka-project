const db = require('../utils/db');
const logger = require('../utils/logger');

class ApiKeyStore {
  async saveApiKey(encryptedKey, description = '') {
    try {
      const keyData = {
        id: 'openrouter-main',
        key: encryptedKey,
        description,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        isActive: true,
        updatedAt: new Date().toISOString()
      };

      await db.saveAPIKey(keyData);
      logger.info('OpenRouter API key saved successfully', { 
        description,
        keyLength: encryptedKey.encrypted?.length || 0
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to save OpenRouter API key', { error: error.message });
      throw new Error('Failed to save API key');
    }
  }

  async getApiKey() {
    try {
      const apiKeyData = await db.getAPIKey();
      
      if (!apiKeyData || !apiKeyData.key) {
        return null;
      }

      return apiKeyData;
    } catch (error) {
      logger.error('Failed to retrieve OpenRouter API key', { error: error.message });
      return null;
    }
  }

  async deleteApiKey() {
    try {
      await db.deleteAPIKey();
      logger.info('OpenRouter API key deleted successfully');
      return true;
    } catch (error) {
      logger.error('Failed to delete OpenRouter API key', { error: error.message });
      throw new Error('Failed to delete API key');
    }
  }

  async updateLastUsed() {
    try {
      const apiKeyData = await this.getApiKey();
      if (apiKeyData) {
        apiKeyData.lastUsed = new Date().toISOString();
        await db.saveAPIKey(apiKeyData);
      }
    } catch (error) {
      logger.error('Failed to update API key last used', { error: error.message });
    }
  }
}

module.exports = new ApiKeyStore();
