const db = require('./index');
const { encrypt, decrypt } = require('../utils/encrypt');

/**
 * API Key Model
 * Handles encrypted API key storage and retrieval
 */
class ApiKeyModel {
  constructor() {
    this.filename = 'apiKey.store.enc';
  }

  async save(apiKey, description = '') {
    const keyData = {
      key: encrypt(apiKey),
      description: description || '',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true
    };

    await db.writeFile(this.filename, keyData);
    return keyData;
  }

  async get() {
    const data = await db.readFile(this.filename);
    
    if (!data || !data.isActive) {
      return null;
    }

    return {
      ...data,
      key: decrypt(data.key)
    };
  }

  async getStatus() {
    const data = await db.readFile(this.filename);
    
    if (!data || !data.isActive) {
      return {
        configured: false,
        description: '',
        createdAt: null,
        lastUsed: null
      };
    }

    return {
      configured: true,
      description: data.description || '',
      createdAt: data.createdAt,
      lastUsed: data.lastUsed
    };
  }

  async updateLastUsed() {
    const data = await db.readFile(this.filename);
    
    if (data && data.isActive) {
      data.lastUsed = new Date().toISOString();
      await db.writeFile(this.filename, data);
    }
  }

  async delete() {
    await db.deleteFile(this.filename);
    return true;
  }
}

module.exports = new ApiKeyModel();
