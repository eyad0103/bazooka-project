const openrouterClient = require('./openrouterClient');
const apiKeyStore = require('../storage/apiKeyStore');
const encryption = require('../security/encryption');
const db = require('../utils/db');
const logger = require('../utils/logger');

class AIService {
  async isApiKeyConfigured() {
    try {
      const apiKeyData = await apiKeyStore.getApiKey();
      return {
        configured: !!apiKeyData,
        description: apiKeyData?.description || '',
        createdAt: apiKeyData?.createdAt || null,
        lastUsed: apiKeyData?.lastUsed || null
      };
    } catch (error) {
      logger.error('Failed to check API key configuration', { error: error.message });
      return { configured: false };
    }
  }

  async saveApiKey(key, description = '') {
    if (!key || typeof key !== 'string') {
      throw new Error('API key is required');
    }

    if (!key.startsWith('sk-or-')) {
      throw new Error('Invalid API key format. Key should start with "sk-or-"');
    }

    try {
      const encryptedKey = encryption.encrypt(key);
      await apiKeyStore.saveApiKey(encryptedKey, description);
      
      return {
        success: true,
        message: 'API key saved successfully'
      };
    } catch (error) {
      logger.error('Failed to save API key', { error: error.message });
      throw error;
    }
  }

  async testApiKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('API key is required');
    }

    try {
      const isValid = await openrouterClient.testApiKey(key);
      
      return {
        success: true,
        valid: isValid,
        message: isValid ? 'API key is valid' : 'API key is invalid'
      };
    } catch (error) {
      logger.error('API key test failed', { error: error.message });
      return {
        success: false,
        valid: false,
        message: error.message
      };
    }
  }

  async deleteApiKey() {
    try {
      await apiKeyStore.deleteApiKey();
      
      return {
        success: true,
        message: 'API key deleted successfully'
      };
    } catch (error) {
      logger.error('Failed to delete API key', { error: error.message });
      throw error;
    }
  }

  async getApiKeyStatus() {
    try {
      const status = await this.isApiKeyConfigured();
      
      return {
        success: true,
        ...status
      };
    } catch (error) {
      logger.error('Failed to get API key status', { error: error.message });
      return {
        success: false,
        configured: false,
        error: error.message
      };
    }
  }

  async chatWithAI(message, context = null) {
    try {
      const apiKeyData = await apiKeyStore.getApiKey();
      
      if (!apiKeyData || !apiKeyData.key) {
        throw new Error('OpenRouter API key not configured');
      }

      const decryptedKey = encryption.decrypt(apiKeyData.key);

      // Get system context
      const pcs = await db.getAllPCs();
      const errors = await db.getErrors();

      const systemContext = {
        totalPCs: pcs.length,
        onlinePCs: pcs.filter(pc => pc.status === 'online').length,
        recentErrors: errors.slice(0, 10),
        systemOverview: pcs.map(pc => ({
          displayName: pc.displayName,
          status: pc.status,
          lastSeen: pc.lastSeen
        }))
      };

      const prompt = `You are a PC monitoring AI assistant. Help the user with their PC monitoring system.

Current System Context:
${JSON.stringify(systemContext, null, 2)}

User Question: ${message}

Additional Context: ${context || 'None provided'}

Provide helpful, actionable advice about PC monitoring, error troubleshooting, and system management.`;

      const response = await openrouterClient.chatWithAI(decryptedKey, [
        {
          role: 'user',
          content: prompt
        }
      ]);

      // Update last used timestamp
      await apiKeyStore.updateLastUsed();

      logger.info('AI chat response generated', { 
        model: openrouterClient.model 
      });

      return {
        success: true,
        response,
        model: openrouterClient.model,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('AI chat failed', { error: error.message });
      
      if (error.message.includes('not configured')) {
        throw new Error('OpenRouter API key not configured');
      } else if (error.message.includes('Invalid OpenRouter API key')) {
        throw new Error('Invalid OpenRouter API key');
      } else {
        throw new Error('Failed to get AI response');
      }
    }
  }

  async explainError(errorId) {
    try {
      const apiKeyData = await apiKeyStore.getApiKey();
      
      if (!apiKeyData || !apiKeyData.key) {
        throw new Error('OpenRouter API key not configured');
      }

      const decryptedKey = encryption.decrypt(apiKeyData.key);
      const error = await db.getError(errorId);
      
      if (!error) {
        throw new Error('Error not found');
      }

      const prompt = `You are a PC monitoring AI assistant. Explain this error and provide troubleshooting steps.

Error Details:
${JSON.stringify(error, null, 2)}

Please provide:
1. What this error means
2. Common causes
3. Step-by-step troubleshooting steps
4. Prevention recommendations`;

      const explanation = await openrouterClient.chatWithAI(decryptedKey, [
        {
          role: 'user',
          content: prompt
        }
      ]);

      // Update last used timestamp
      await apiKeyStore.updateLastUsed();

      logger.info('AI explanation generated', { 
        errorId, 
        pcId: error.pcId,
        model: openrouterClient.model 
      });

      return {
        success: true,
        errorId,
        explanation,
        model: openrouterClient.model,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('AI explanation failed', { error: error.message });
      
      if (error.message.includes('not configured')) {
        throw new Error('OpenRouter API key not configured');
      } else if (error.message.includes('Invalid OpenRouter API key')) {
        throw new Error('Invalid OpenRouter API key');
      } else {
        throw new Error('Failed to generate AI explanation');
      }
    }
  }
}

module.exports = new AIService();
