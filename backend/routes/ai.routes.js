const express = require('express');
const router = express.Router();
const aiController = require('../ai/aiController');

// GET /api/ai/status - Check AI status
router.get('/status', aiController.getStatus.bind(aiController));

// POST /api/ai/chat - Chat with AI
router.post('/chat', aiController.chat.bind(aiController));

// POST /api/ai/explain-error - Explain an error
router.post('/explain-error', aiController.explainError.bind(aiController));

module.exports = router;
