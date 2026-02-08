const express = require('express');
const router = express.Router();
const Error = require('../models/Error');

// In-memory storage
const errors = new Map();

// Report error from PC
router.post('/', async (req, res) => {
  const { apiKey, type, message, details } = req.body;
  
  if (!apiKey || !type || !message) {
    return res.status(400).json({ error: 'API key, type, and message are required' });
  }
  
  // Find PC (this would normally come from database)
  const pcName = 'Unknown PC'; // In real implementation, find PC by apiKey
  
  const error = new Error(apiKey, pcName, type, message, details);
  errors.set(error.id, error);
  
  console.log(`⚠️ Error reported: ${type} - ${message}`);
  
  res.status(201).json({
    message: 'Error reported successfully',
    errorId: error.id,
    timestamp: error.timestamp
  });
});

// Get all errors
router.get('/', (req, res) => {
  const errorsArray = Array.from(errors.values()).sort((a, b) => b.timestamp - a.timestamp);
  
  res.json({
    errors: errorsArray,
    total: errorsArray.length
  });
});

// Get errors by PC
router.get('/pc/:pcId', (req, res) => {
  const { pcId } = req.params;
  const pcErrors = Array.from(errors.values())
    .filter(error => error.pcId === pcId)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  res.json({
    errors: pcErrors,
    total: pcErrors.length
  });
});

module.exports = router;
