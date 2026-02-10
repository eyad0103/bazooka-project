const db = require('./index');

/**
 * PC Model
 * Handles PC data storage and retrieval
 */
class PCModel {
  constructor() {
    this.filename = 'pcs.store.json';
  }

  async findAll() {
    const data = await db.readFile(this.filename);
    return data ? data.pcs || [] : [];
  }

  async findById(pcId) {
    const pcs = await this.findAll();
    return pcs.find(pc => pc.id === pcId) || null;
  }

  async create(pcData) {
    const pcs = await this.findAll();
    const newPC = {
      id: pcData.id,
      name: pcData.name || `PC-${pcData.id}`,
      status: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...pcData
    };
    
    pcs.push(newPC);
    await db.writeFile(this.filename, { pcs });
    return newPC;
  }

  async update(pcId, updateData) {
    const pcs = await this.findAll();
    const index = pcs.findIndex(pc => pc.id === pcId);
    
    if (index === -1) {
      throw new Error(`PC with ID ${pcId} not found`);
    }

    pcs[index] = {
      ...pcs[index],
      ...updateData,
      lastSeen: new Date().toISOString()
    };

    await db.writeFile(this.filename, { pcs });
    return pcs[index];
  }

  async delete(pcId) {
    const pcs = await this.findAll();
    const filteredPCs = pcs.filter(pc => pc.id !== pcId);
    
    if (filteredPCs.length === pcs.length) {
      throw new Error(`PC with ID ${pcId} not found`);
    }

    await db.writeFile(this.filename, { pcs });
    return true;
  }
}

module.exports = new PCModel();
