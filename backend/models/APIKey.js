class APIKey {
  constructor(key, description = '') {
    this.id = 'main';
    this.key = key;
    this.description = description;
    this.createdAt = new Date().toISOString();
    this.lastUsed = null;
    this.isActive = true;
  }

  markUsed() {
    this.lastUsed = new Date().toISOString();
  }

  deactivate() {
    this.isActive = false;
    this.deactivatedAt = new Date().toISOString();
  }

  updateKey(newKey, description = '') {
    this.key = newKey;
    this.description = description;
    this.updatedAt = new Date().toISOString();
    this.isActive = true;
  }

  toJSON() {
    return {
      id: this.id,
      key: this.key,
      description: this.description,
      createdAt: this.createdAt,
      lastUsed: this.lastUsed,
      isActive: this.isActive,
      updatedAt: this.updatedAt,
      deactivatedAt: this.deactivatedAt
    };
  }

  static createFromData(data) {
    const apiKey = new APIKey(data.key, data.description);
    Object.assign(apiKey, data);
    return apiKey;
  }
}

module.exports = APIKey;
