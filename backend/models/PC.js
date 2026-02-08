const { v4: uuidv4 } = require('uuid');

class PC {
  constructor(pcId, displayName) {
    this.pcId = pcId;
    this.displayName = displayName || `PC-${pcId.substring(0, 8)}`;
    this.status = 'online';
    this.lastSeen = new Date().toISOString();
    this.registeredAt = new Date().toISOString();
    this.systemInfo = {};
    this.heartbeatInterval = 30000; // 30 seconds
  }

  updateHeartbeat(systemInfo = {}) {
    this.lastSeen = new Date().toISOString();
    this.status = 'online';
    if (systemInfo) {
      this.systemInfo = { ...this.systemInfo, ...systemInfo };
    }
  }

  markOffline() {
    this.status = 'offline';
  }

  rename(newDisplayName) {
    this.displayName = newDisplayName;
    this.lastModified = new Date().toISOString();
  }

  toJSON() {
    return {
      pcId: this.pcId,
      displayName: this.displayName,
      status: this.status,
      lastSeen: this.lastSeen,
      registeredAt: this.registeredAt,
      systemInfo: this.systemInfo,
      heartbeatInterval: this.heartbeatInterval,
      lastModified: this.lastModified
    };
  }

  static createFromData(data) {
    const pc = new PC(data.pcId, data.displayName);
    Object.assign(pc, data);
    return pc;
  }
}

module.exports = PC;
