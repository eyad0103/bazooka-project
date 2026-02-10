const express = require('express');
const AIController = require('../controllers/ai.controller');
const router = express.Router();

/**
 * AI Routes
 * Handle all AI-related endpoints
 */

// POST /api/ai/chat - Chat with AI
router.post('/chat', AIController.chat);

// GET /api/ai/explain/:errorId - Explain error with AI
router.get('/explain/:errorId', AIController.explainError);

module.exports = router;
