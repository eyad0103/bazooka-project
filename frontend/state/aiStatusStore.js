// AI Status Store - ONLY holds backend-derived status

class AIStatusStore {
  constructor() {
    this.status = {
      configured: false,
      description: '',
      createdAt: null,
      lastUsed: null
    };
    this.listeners = [];
    this.lastCheck = null;
    this.checkInterval = 30000; // 30 seconds
  }

  // Subscribe to status changes
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Immediately call with current status
    callback(this.status);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of status change
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.status));
  }

  // Update status from backend
  async updateStatus() {
    try {
      // Placeholder for actual API call
      // const response = await aiApi.getStatus();
      
      // Simulate response for now
      const response = { success: true, configured: false };
      
      if (response.success) {
        this.status = {
          configured: response.configured,
          description: response.description || '',
          createdAt: response.createdAt || null,
          lastUsed: response.lastUsed || null
        };
        this.lastCheck = new Date();
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to update AI status:', error);
      // On error, assume not configured
      this.status = {
        configured: false,
        description: '',
        createdAt: null,
        lastUsed: null
      };
      this.notifyListeners();
    }
  }

  // Get current status
  getStatus() {
    return { ...this.status };
  }

  // Check if AI is available
  isAvailable() {
    return this.status.configured;
  }

  // Start periodic status checking
  startPeriodicCheck() {
    // Initial check
    this.updateStatus();
    
    // Set up interval
    this.interval = setInterval(() => {
      this.updateStatus();
    }, this.checkInterval);
  }

  // Stop periodic status checking
  stopPeriodicCheck() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // Force immediate status refresh
  async refresh() {
    await this.updateStatus();
  }
}

// Make available globally
const aiStatusStore = new AIStatusStore();
window.aiStatusStore = aiStatusStore;
