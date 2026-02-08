const { MongoClient } = require('mongodb');
const config = require('../config/serverConfig');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.memoryStorage = {
      pcs: new Map(),
      errors: new Map(),
      apiKeys: new Map()
    };
  }

  async connect() {
    try {
      this.client = new MongoClient(config.database.url);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      console.log('Connected to MongoDB');
      
      // Create indexes
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('MongoDB connection failed, using memory storage:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  async createIndexes() {
    if (!this.db) return;
    
    try {
      await this.db.collection('pcs').createIndex({ pcId: 1 }, { unique: true });
      await this.db.collection('errors').createIndex({ errorId: 1 }, { unique: true });
      await this.db.collection('errors').createIndex({ pcId: 1 });
      await this.db.collection('errors').createIndex({ timestamp: -1 });
      console.log('Database indexes created');
    } catch (error) {
      console.error('Failed to create indexes:', error);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // PC operations
  async savePC(pcData) {
    if (this.isConnected) {
      try {
        await this.db.collection('pcs').replaceOne(
          { pcId: pcData.pcId },
          pcData,
          { upsert: true }
        );
      } catch (error) {
        console.error('Failed to save PC to database:', error);
        this.memoryStorage.pcs.set(pcData.pcId, pcData);
      }
    } else {
      this.memoryStorage.pcs.set(pcData.pcId, pcData);
    }
  }

  async getPC(pcId) {
    if (this.isConnected) {
      try {
        return await this.db.collection('pcs').findOne({ pcId });
      } catch (error) {
        console.error('Failed to get PC from database:', error);
        return this.memoryStorage.pcs.get(pcId);
      }
    } else {
      return this.memoryStorage.pcs.get(pcId);
    }
  }

  async getAllPCs() {
    if (this.isConnected) {
      try {
        return await this.db.collection('pcs').find({}).toArray();
      } catch (error) {
        console.error('Failed to get PCs from database:', error);
        return Array.from(this.memoryStorage.pcs.values());
      }
    } else {
      return Array.from(this.memoryStorage.pcs.values());
    }
  }

  async updatePC(pcId, updates) {
    if (this.isConnected) {
      try {
        await this.db.collection('pcs').updateOne(
          { pcId },
          { $set: updates }
        );
      } catch (error) {
        console.error('Failed to update PC in database:', error);
        const pc = this.memoryStorage.pcs.get(pcId);
        if (pc) {
          Object.assign(pc, updates);
          this.memoryStorage.pcs.set(pcId, pc);
        }
      }
    } else {
      const pc = this.memoryStorage.pcs.get(pcId);
      if (pc) {
        Object.assign(pc, updates);
        this.memoryStorage.pcs.set(pcId, pc);
      }
    }
  }

  // Error operations
  async saveError(errorData) {
    if (this.isConnected) {
      try {
        await this.db.collection('errors').insertOne(errorData);
      } catch (error) {
        console.error('Failed to save error to database:', error);
        this.memoryStorage.errors.set(errorData.errorId, errorData);
      }
    } else {
      this.memoryStorage.errors.set(errorData.errorId, errorData);
    }
  }

  async getErrors(pcId = null) {
    if (this.isConnected) {
      try {
        const query = pcId ? { pcId } : {};
        return await this.db.collection('errors')
          .find(query)
          .sort({ timestamp: -1 })
          .toArray();
      } catch (error) {
        console.error('Failed to get errors from database:', error);
        const errors = Array.from(this.memoryStorage.errors.values());
        return pcId ? errors.filter(e => e.pcId === pcId) : errors;
      }
    } else {
      const errors = Array.from(this.memoryStorage.errors.values());
      return pcId ? errors.filter(e => e.pcId === pcId) : errors;
    }
  }

  // API Key operations
  async saveAPIKey(keyData) {
    if (this.isConnected) {
      try {
        await this.db.collection('apiKeys').replaceOne(
          { id: 'main' },
          keyData,
          { upsert: true }
        );
      } catch (error) {
        console.error('Failed to save API key to database:', error);
        this.memoryStorage.apiKeys.set('main', keyData);
      }
    } else {
      this.memoryStorage.apiKeys.set('main', keyData);
    }
  }

  async getAPIKey() {
    if (this.isConnected) {
      try {
        return await this.db.collection('apiKeys').findOne({ id: 'main' });
      } catch (error) {
        console.error('Failed to get API key from database:', error);
        return this.memoryStorage.apiKeys.get('main');
      }
    } else {
      return this.memoryStorage.apiKeys.get('main');
    }
  }

  async deleteAPIKey() {
    if (this.isConnected) {
      try {
        await this.db.collection('apiKeys').deleteOne({ id: 'main' });
      } catch (error) {
        console.error('Failed to delete API key from database:', error);
        this.memoryStorage.apiKeys.delete('main');
      }
    } else {
      this.memoryStorage.apiKeys.delete('main');
    }
  }
}

module.exports = new Database();
