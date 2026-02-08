const express = require('express');
const router = express.Router();
const axios = require('axios');

// In-memory storage for chat history (replace with database in production)
const chatHistory = new Map();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// AI Chat endpoint
router.post('/', async (req, res) => {
  const { message, sessionId = 'default', context } = req.body;
  
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenRouter API key not configured',
      message: 'Please set OPENROUTER_API_KEY environment variable'
    });
  }
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Store user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: message,
      context: context || null,
      timestamp: new Date().toISOString()
    };
    
    // Get or create session history
    if (!chatHistory.has(sessionId)) {
      chatHistory.set(sessionId, []);
    }
    const sessionHistory = chatHistory.get(sessionId);
    sessionHistory.push(userMessage);
    
    // Prepare messages for OpenRouter
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant for the Bazooka PC Monitoring System. You help users understand their PC monitoring data, troubleshoot issues, and provide insights about system performance. Be helpful, concise, and technical. Current context: ${JSON.stringify(context || {})}\n\nRecent conversation history:\n${sessionHistory.slice(-5).map(h => `${h.type}: ${h.message}`).join('\n')}`
      },
      ...sessionHistory.slice(-5).map(h => ({
        role: h.type === 'user' ? 'user' : 'assistant',
        content: h.message
      })),
      {
        role: 'user',
        content: message
      }
    ];
    
    // Call OpenRouter API
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bazooka-project-1.onrender.com',
        'X-Title': 'Bazooka PC Monitoring System'
      }
    });
    
    const aiResponse = response.data.choices[0].message.content;
    
    // Store AI response
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      message: aiResponse,
      model: response.data.model,
      timestamp: new Date().toISOString()
    };
    
    sessionHistory.push(assistantMessage);
    
    // Keep only last 50 messages per session
    if (sessionHistory.length > 50) {
      chatHistory.set(sessionId, sessionHistory.slice(-50));
    }
    
    res.json({
      message: aiResponse,
      sessionId: sessionId,
      model: response.data.model,
      timestamp: assistantMessage.timestamp
    });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process AI chat',
      message: error.message 
    });
  }
});

// Get chat history
router.get('/:sessionId?', (req, res) => {
  const sessionId = req.params.sessionId || 'default';
  const limit = parseInt(req.query.limit) || 50;
  
  const history = chatHistory.get(sessionId) || [];
  
  res.json({
    sessionId: sessionId,
    messages: history.slice(-limit),
    total: history.length
  });
});

// Clear chat history
router.delete('/:sessionId?', (req, res) => {
  const sessionId = req.params.sessionId || 'default';
  
  chatHistory.delete(sessionId);
  
  res.json({
    message: 'Chat history cleared',
    sessionId: sessionId
  });
});

module.exports = router;
