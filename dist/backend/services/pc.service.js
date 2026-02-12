const PCModel = require('../db/pc.model');
const logger = require('../utils/logger');

/**
 * PC Service
 * Handles PC business logic
 */
class PCService {
  async getAllPCs() {
    try {
      const pcs = await PCModel.findAll();
      logger.info('Retrieved all PCs', { count: pcs.length });
      return pcs;
    } catch (error) {
      logger.error('Failed to retrieve PCs', { error: error.message });
      throw error;
    }
  }

  async getPCById(pcId) {
    try {
      const pc = await PCModel.findById(pcId);
      if (!pc) {
        throw new Error(`PC with ID ${pcId} not found`);
      }
      logger.info('Retrieved PC by ID', { pcId });
      return pc;
    } catch (error) {
      logger.error('Failed to retrieve PC', { pcId, error: error.message });
      throw error;
    }
  }

  async registerPC(pcData) {
    try {
      // Check if PC already exists
      const existingPC = await PCModel.findById(pcData.id);
      if (existingPC) {
        logger.warn('PC already registered, updating', { pcId: pcData.id });
        return await PCModel.update(pcData.id, pcData);
      }

      const newPC = await PCModel.create(pcData);
      logger.info('PC registered successfully', { pcId: newPC.id, name: newPC.name });
      return newPC;
    } catch (error) {
      logger.error('Failed to register PC', { pcData, error: error.message });
      throw error;
    }
  }

  async updatePC(pcId, updateData) {
    try {
      const updatedPC = await PCModel.update(pcId, updateData);
      logger.info('PC updated successfully', { pcId, updateData });
      return updatedPC;
    } catch (error) {
      logger.error('Failed to update PC', { pcId, updateData, error: error.message });
      throw error;
    }
  }

  async deletePC(pcId) {
    try {
      await PCModel.delete(pcId);
      logger.info('PC deleted successfully', { pcId });
      return true;
    } catch (error) {
      logger.error('Failed to delete PC', { pcId, error: error.message });
      throw error;
    }
  }

  async updateHeartbeat(pcId, heartbeatData) {
    try {
      const updateData = {
        status: heartbeatData.status || 'online',
        lastSeen: new Date().toISOString(),
        ...heartbeatData
      };

      const updatedPC = await PCModel.update(pcId, updateData);
      logger.info('Heartbeat updated', { pcId, status: updateData.status });
      return updatedPC;
    } catch (error) {
      logger.error('Failed to update heartbeat', { pcId, error: error.message });
      throw error;
    }
  }
}

module.exports = new PCService();
