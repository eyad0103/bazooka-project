const express = require('express');
const router = express.Router();

/**
 * Health Routes
 * Simple health check without AI or heavy DB logic
 */

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bazooka PC Monitor is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
