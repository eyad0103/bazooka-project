const PCService = require('../services/pc.service');
const logger = require('../utils/logger');

/**
 * PC Controller
 * Handles PC HTTP requests
 */
class PCController {
  async getAllPCs(req, res) {
    try {
      const pcs = await PCService.getAllPCs();
      res.json({
        success: true,
        data: pcs,
        count: pcs.length
      });
    } catch (error) {
      logger.error('Get all PCs failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPCById(req, res) {
    try {
      const { pcId } = req.params;
      const pc = await PCService.getPCById(pcId);
      res.json({
        success: true,
        data: pc
      });
    } catch (error) {
      logger.error('Get PC by ID failed', { error: error.message });
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async registerPC(req, res) {
    try {
      const pcData = req.body;
      const newPC = await PCService.registerPC(pcData);
      res.status(201).json({
        success: true,
        data: newPC,
        message: 'PC registered successfully'
      });
    } catch (error) {
      logger.error('Register PC failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updatePC(req, res) {
    try {
      const { pcId } = req.params;
      const updateData = req.body;
      const updatedPC = await PCService.updatePC(pcId, updateData);
      res.json({
        success: true,
        data: updatedPC,
        message: 'PC updated successfully'
      });
    } catch (error) {
      logger.error('Update PC failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deletePC(req, res) {
    try {
      const { pcId } = req.params;
      await PCService.deletePC(pcId);
      res.json({
        success: true,
        message: 'PC deleted successfully'
      });
    } catch (error) {
      logger.error('Delete PC failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateHeartbeat(req, res) {
    try {
      const { pcId } = req.params;
      const heartbeatData = req.body;
      const updatedPC = await PCService.updateHeartbeat(pcId, heartbeatData);
      res.json({
        success: true,
        data: updatedPC,
        message: 'Heartbeat updated successfully'
      });
    } catch (error) {
      logger.error('Update heartbeat failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PCController();
