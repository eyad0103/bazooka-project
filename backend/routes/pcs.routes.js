const express = require('express');
const PCController = require('../controllers/pcs.controller');
const router = express.Router();

/**
 * PC Routes
 * Handle all PC-related endpoints
 */

// GET /api/pcs - Get all PCs
router.get('/', PCController.getAllPCs);

// GET /api/pcs/:pcId - Get specific PC
router.get('/:pcId', PCController.getPCById);

// POST /api/pcs - Register new PC
router.post('/', PCController.registerPC);

// PUT /api/pcs/:pcId - Update PC
router.put('/:pcId', PCController.updatePC);

// DELETE /api/pcs/:pcId - Delete PC
router.delete('/:pcId', PCController.deletePC);

// PUT /api/pcs/:pcId/heartbeat - Update heartbeat (must come before generic :pcId)
router.put('/:pcId/heartbeat', PCController.updateHeartbeat);

module.exports = router;
