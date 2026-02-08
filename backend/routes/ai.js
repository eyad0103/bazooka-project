const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/serverConfig');
const db = require('../utils/db');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');

// Explain error with AI
router.post('/explain_error', async (req, res) => {
  try {
    const { errorId } = req.body;

    if (!errorId) {
      return res.status(400).json({ error: 'Error ID is required' });
    }

    // Get API key
    const apiKeyData = await db.getAPIKey();
    if (!apiKeyData || !apiKeyData.key) {
      return res.status(400).json({ 
        error: 'OpenRouter API key not configured',
        requiresApiKey: true
      });
    }

    // Decrypt API key
    const decryptedKey = encryption.decrypt(apiKeyData.key);

    // Get error details
    const errors = await db.getErrors();
    const error = errors.find(e => e.errorId === errorId);

    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }

    // Get PC information for context
    const pc = await db.getPC(error.pcId);
    const pcInfo = pc ? {
      displayName: pc.displayName,
      status: pc.status,
      lastSeen: pc.lastSeen,
      systemInfo: pc.systemInfo
    } : null;

    // Prepare AI prompt
    const prompt = `You are a PC monitoring AI assistant. Analyze this error and provide a clear explanation and actionable solution.

Error Details:
- Error ID: ${error.errorId}
- PC: ${error.pcName} (${error.pcId})
- Error Type: ${error.errorType}
- Severity: ${error.severity}
- Message: ${error.message}
- Timestamp: ${error.timestamp}
- Details: ${JSON.stringify(error.details, null, 2)}

PC Context:
${pcInfo ? JSON.stringify(pcInfo, null, 2) : 'PC information not available'}

Please provide:
1. A clear explanation of what this error means
2. Likely causes
3. Step-by-step troubleshooting steps
4. Prevention recommendations

Format your response in clear, easy-to-understand language for a non-technical PC owner.`;

    // Call OpenRouter API
    const response = await axios.post(`${config.openrouter.baseUrl}/chat/completions`, {
      model: config.openrouter.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful PC monitoring AI assistant that explains technical errors in simple terms and provides actionable solutions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.openrouter.maxTokens,
      temperature: config.openrouter.temperature
    }, {
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Bazooka PC Monitoring System'
      }
    });

    const aiExplanation = response.data.choices[0].message.content;

    // Mark API key as used
    apiKeyData.markUsed();
    await db.saveAPIKey(apiKeyData.toJSON());

    logger.info('AI explanation generated', { 
      errorId, 
      pcId: error.pcId,
      model: config.openrouter.model 
    });

    res.json({
      success: true,
      errorId,
      explanation: aiExplanation,
      model: config.openrouter.model,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI explanation failed', { error: error.message });
    
    if (error.response?.status === 401) {
      return res.status(400).json({ 
        error: 'Invalid OpenRouter API key',
        requiresApiKey: true
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate AI explanation',
      details: error.message 
    });
  }
});

// General AI chat
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key
    const apiKeyData = await db.getAPIKey();
    if (!apiKeyData || !apiKeyData.key) {
      return res.status(400).json({ 
        error: 'OpenRouter API key not configured',
        requiresApiKey: true
      });
    }

    // Decrypt API key
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

    // Call OpenRouter API
    const response = await axios.post(`${config.openrouter.baseUrl}/chat/completions`, {
      model: config.openrouter.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful PC monitoring AI assistant. Provide clear, actionable advice about PC monitoring and troubleshooting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.openrouter.maxTokens,
      temperature: config.openrouter.temperature
    }, {
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Bazooka PC Monitoring System'
      }
    });

    const aiResponse = response.data.choices[0].message.content;

    // Mark API key as used
    apiKeyData.markUsed();
    await db.saveAPIKey(apiKeyData.toJSON());

    logger.info('AI chat response generated', { 
      model: config.openrouter.model 
    });

    res.json({
      success: true,
      response: aiResponse,
      model: config.openrouter.model,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI chat failed', { error: error.message });
    
    if (error.response?.status === 401) {
      return res.status(400).json({ 
        error: 'Invalid OpenRouter API key',
        requiresApiKey: true
      });
    }

    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

module.exports = router;
