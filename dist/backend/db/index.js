const fs = require('fs').promises;
const path = require('path');

/**
 * Database Manager
 * Handles all file-based storage operations
 */
class Database {
  constructor() {
    this.storagePath = path.resolve(__dirname, '../storage');
  }

  async ensureStorage() {
    try {
      await fs.access(this.storagePath);
    } catch (error) {
      await fs.mkdir(this.storagePath, { recursive: true });
    }
  }

  async readFile(filename) {
    await this.ensureStorage();
    const filePath = path.join(this.storagePath, filename);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async writeFile(filename, data) {
    await this.ensureStorage();
    const filePath = path.join(this.storagePath, filename);
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
  }

  async deleteFile(filename) {
    await this.ensureStorage();
    const filePath = path.join(this.storagePath, filename);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new Database();
