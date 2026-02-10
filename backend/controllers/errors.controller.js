const ErrorService = require('../services/error.service');
const logger = require('../utils/logger');

/**
 * Error Controller
 * Handles Error HTTP requests
 */
class ErrorController {
  async getAllErrors(req, res) {
    try {
      const errors = await ErrorService.getAllErrors();
      res.json({
        success: true,
        data: errors,
        count: errors.length
      });
    } catch (error) {
      logger.error('Get all errors failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getErrorsByPCId(req, res) {
    try {
      const { pcId } = req.params;
      const errors = await ErrorService.getErrorsByPCId(pcId);
      res.json({
        success: true,
        data: errors,
        count: errors.length
      });
    } catch (error) {
      logger.error('Get errors by PC ID failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createError(req, res) {
    try {
      const errorData = req.body;
      const newError = await ErrorService.createError(errorData);
      res.status(201).json({
        success: true,
        data: newError,
        message: 'Error created successfully'
      });
    } catch (error) {
      logger.error('Create error failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async resolveError(req, res) {
    try {
      const { errorId } = req.params;
      const resolvedError = await ErrorService.resolveError(errorId);
      res.json({
        success: true,
        data: resolvedError,
        message: 'Error resolved successfully'
      });
    } catch (error) {
      logger.error('Resolve error failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteError(req, res) {
    try {
      const { errorId } = req.params;
      await ErrorService.deleteError(errorId);
      res.json({
        success: true,
        message: 'Error deleted successfully'
      });
    } catch (error) {
      logger.error('Delete error failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ErrorController();
