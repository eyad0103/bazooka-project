const express = require('express');
const ErrorController = require('../controllers/errors.controller');
const router = express.Router();

/**
 * Error Routes
 * Handle all error-related endpoints
 */

// GET /api/errors - Get all errors
router.get('/', ErrorController.getAllErrors);

// GET /api/errors/pc/:pcId - Get errors by PC ID
router.get('/pc/:pcId', ErrorController.getErrorsByPCId);

// POST /api/errors - Create new error
router.post('/', ErrorController.createError);

// PUT /api/errors/:errorId/resolve - Resolve error
router.put('/:errorId/resolve', ErrorController.resolveError);

// DELETE /api/errors/:errorId - Delete error
router.delete('/:errorId', ErrorController.deleteError);

module.exports = router;
