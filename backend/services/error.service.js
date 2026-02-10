const ErrorModel = require('../db/error.model');
const logger = require('../utils/logger');

/**
 * Error Service
 * Handles error business logic
 */
class ErrorService {
  async getAllErrors() {
    try {
      const errors = await ErrorModel.findAll();
      logger.info('Retrieved all errors', { count: errors.length });
      return errors;
    } catch (error) {
      logger.error('Failed to retrieve errors', { error: error.message });
      throw error;
    }
  }

  async getErrorsByPCId(pcId) {
    try {
      const errors = await ErrorModel.findByPCId(pcId);
      logger.info('Retrieved errors by PC ID', { pcId, count: errors.length });
      return errors;
    } catch (error) {
      logger.error('Failed to retrieve errors by PC ID', { pcId, error: error.message });
      throw error;
    }
  }

  async createError(errorData) {
    try {
      const newError = await ErrorModel.create(errorData);
      logger.info('Error created', { errorId: newError.id, pcId: errorData.pcId });
      return newError;
    } catch (error) {
      logger.error('Failed to create error', { errorData, error: error.message });
      throw error;
    }
  }

  async resolveError(errorId) {
    try {
      const resolvedError = await ErrorModel.update(errorId, { resolved: true });
      logger.info('Error resolved', { errorId });
      return resolvedError;
    } catch (error) {
      logger.error('Failed to resolve error', { errorId, error: error.message });
      throw error;
    }
  }

  async deleteError(errorId) {
    try {
      await ErrorModel.delete(errorId);
      logger.info('Error deleted', { errorId });
      return true;
    } catch (error) {
      logger.error('Failed to delete error', { errorId, error: error.message });
      throw error;
    }
  }
}

module.exports = new ErrorService();
