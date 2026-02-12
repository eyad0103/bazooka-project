const db = require('./index');

/**
 * Error Model
 * Handles error data storage and retrieval
 */
class ErrorModel {
  constructor() {
    this.filename = 'errors.store.json';
  }

  async findAll() {
    const data = await db.readFile(this.filename);
    return data ? data.errors || [] : [];
  }

  async findByPCId(pcId) {
    const errors = await this.findAll();
    return errors.filter(error => error.pcId === pcId);
  }

  async create(errorData) {
    const errors = await this.findAll();
    const newError = {
      id: this.generateId(),
      pcId: errorData.pcId,
      message: errorData.message,
      stack: errorData.stack || '',
      timestamp: new Date().toISOString(),
      severity: errorData.severity || 'error',
      resolved: false,
      ...errorData
    };
    
    errors.push(newError);
    await db.writeFile(this.filename, { errors });
    return newError;
  }

  async update(errorId, updateData) {
    const errors = await this.findAll();
    const index = errors.findIndex(error => error.id === errorId);
    
    if (index === -1) {
      throw new Error(`Error with ID ${errorId} not found`);
    }

    errors[index] = {
      ...errors[index],
      ...updateData
    };

    await db.writeFile(this.filename, { errors });
    return errors[index];
  }

  async delete(errorId) {
    const errors = await this.findAll();
    const filteredErrors = errors.filter(error => error.id !== errorId);
    
    if (filteredErrors.length === errors.length) {
      throw new Error(`Error with ID ${errorId} not found`);
    }

    await db.writeFile(this.filename, { errors });
    return true;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new ErrorModel();
