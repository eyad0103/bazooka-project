const axios = require('axios');
const { EventEmitter } = require('events');

class NetworkClient extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.baseUrl = config.serverUrl;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  async registerPC(pcData) {
    try {
      const response = await this.makeRequest('POST', '/api/pcs/register', pcData);
      
      if (response.success) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('registered', response);
        return response;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      this.emit('error', { type: 'registration', error: error.message });
      throw error;
    }
  }

  async sendHeartbeat(systemInfo) {
    try {
      // First try to register (for new PCs)
      if (!this.isConnected) {
        const response = await this.makeRequest('POST', '/api/pcs/register', {
          pcId: this.config.pcId,
          systemInfo
        });
        
        if (response.success) {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          this.emit('heartbeat-sent', response);
        }
        
        return response;
      }
      
      // For existing PCs, use heartbeat endpoint
      const response = await this.makeRequest('POST', '/api/pcs/heartbeat', {
        pcId: this.config.pcId,
        systemInfo
      });
      
      if (response.success) {
        this.emit('heartbeat-sent', response);
      }
      
      return response;
    } catch (error) {
      this.isConnected = false;
      this.emit('error', { type: 'heartbeat', error: error.message });
      
      // Attempt to reconnect
      this.attemptReconnect();
      throw error;
    }
  }

  async reportError(errorData) {
    try {
      const response = await this.makeRequest('POST', '/api/errors/report', {
        ...errorData,
        pcId: this.config.pcId
      });

      this.emit('error-reported', response);
      return response;
    } catch (error) {
      this.emit('error', { type: 'error_report', error: error.message });
      throw error;
    }
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method,
      url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `Bazooka-Agent/${this.config.version || '2.0.0'}`
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to reach server');
      } else {
        // Other error
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  async testConnection() {
    try {
      const response = await this.makeRequest('GET', '/api/health');
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnect-attempt', { attempt: this.reconnectAttempts });

    setTimeout(async () => {
      try {
        const isHealthy = await this.testConnection();
        if (isHealthy) {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('reconnected');
        } else {
          this.attemptReconnect();
        }
      } catch (error) {
        this.attemptReconnect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  isConnectedToServer() {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      serverUrl: this.baseUrl
    };
  }

  // Utility methods for common requests
  async getServerInfo() {
    try {
      return await this.makeRequest('GET', '/api');
    } catch (error) {
      throw new Error(`Failed to get server info: ${error.message}`);
    }
  }

  async checkAPIHealth() {
    try {
      const response = await this.makeRequest('GET', '/api/health');
      return response;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

module.exports = NetworkClient;
