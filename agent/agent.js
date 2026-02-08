const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import utilities
const SystemInfo = require('./utils/systemInfo');
const ErrorMonitor = require('./utils/errorMonitor');
const NetworkClient = require('./utils/network');

class BazookaAgent {
  constructor() {
    this.config = this.loadConfig();
    this.pcId = this.getOrCreatePCId();
    this.systemInfo = new SystemInfo();
    this.errorMonitor = new ErrorMonitor(this.config);
    this.networkClient = new NetworkClient({ ...this.config, pcId: this.pcId });
    
    this.isRunning = false;
    this.intervals = {
      heartbeat: null,
      systemInfo: null
    };

    this.setupEventHandlers();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, 'config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      serverUrl: 'http://localhost:3000',
      heartbeatInterval: 30000,
      errorCheckInterval: 5000,
      systemInfoInterval: 60000,
      logging: {
        level: 'info',
        maxFileSize: '10MB',
        maxFiles: 5
      }
    };
  }

  getOrCreatePCId() {
    let pcId = this.config.pcId;
    
    if (!pcId) {
      pcId = uuidv4();
      this.config.pcId = pcId;
      this.saveConfig();
      console.log('Generated new PC ID:', pcId);
    }
    
    return pcId;
  }

  saveConfig() {
    try {
      const configPath = path.join(__dirname, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error.message);
    }
  }

  setupEventHandlers() {
    // Error monitor events
    this.errorMonitor.on('error', (errorData) => {
      this.handleDetectedError(errorData);
    });

    this.errorMonitor.on('started', () => {
      console.log('Error monitoring started');
    });

    // Network client events
    this.networkClient.on('registered', (response) => {
      console.log('PC registered successfully:', response.displayName);
    });

    this.networkClient.on('connected', () => {
      console.log('Connected to server');
    });

    this.networkClient.on('disconnected', () => {
      console.log('Disconnected from server');
    });

    this.networkClient.on('error', (errorInfo) => {
      console.error('Network error:', errorInfo);
    });

    this.networkClient.on('reconnect-attempt', (info) => {
      console.log(`Reconnect attempt ${info.attempt}/${this.networkClient.maxReconnectAttempts}`);
    });

    // Process events
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      this.stop();
    });

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      this.stop();
    });
  }

  async start() {
    if (this.isRunning) {
      console.log('Agent is already running');
      return;
    }

    try {
      console.log('Starting Bazooka Agent...');
      console.log('PC ID:', this.pcId);
      console.log('Server URL:', this.config.serverUrl);

      // Start error monitoring
      this.errorMonitor.start();

      // Register PC with server
      await this.registerWithServer();

      // Start periodic tasks
      this.startPeriodicTasks();

      this.isRunning = true;
      console.log('Bazooka Agent started successfully');

    } catch (error) {
      console.error('Failed to start agent:', error.message);
      this.errorMonitor.reportError('startup_error', error.message, {
        stack: error.stack,
        type: 'critical'
      });
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Agent is not running');
      return;
    }

    console.log('Stopping Bazooka Agent...');

    // Clear intervals
    if (this.intervals.heartbeat) {
      clearInterval(this.intervals.heartbeat);
    }
    if (this.intervals.systemInfo) {
      clearInterval(this.intervals.systemInfo);
    }

    // Stop error monitoring
    this.errorMonitor.stop();

    // Report shutdown
    try {
      await this.networkClient.reportError({
        errorType: 'system_signal',
        message: 'Agent shutdown',
        details: { type: 'info', shutdownType: 'graceful' }
      });
    } catch (error) {
      console.error('Failed to report shutdown:', error.message);
    }

    this.isRunning = false;
    console.log('Bazooka Agent stopped');
  }

  async registerWithServer() {
    try {
      const systemInfo = this.systemInfo.getDetailedInfo();
      
      const response = await this.networkClient.registerPC({
        pcId: this.pcId,
        displayName: this.getPCDisplayName(),
        systemInfo
      });

      return response;
    } catch (error) {
      console.error('Failed to register with server:', error.message);
      throw error;
    }
  }

  startPeriodicTasks() {
    // Heartbeat interval
    this.intervals.heartbeat = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('Heartbeat failed:', error.message);
      }
    }, this.config.heartbeatInterval);

    // System info interval
    this.intervals.systemInfo = setInterval(async () => {
      try {
        await this.updateSystemInfo();
      } catch (error) {
        console.error('System info update failed:', error.message);
      }
    }, this.config.systemInfoInterval);

    console.log(`Started periodic tasks:`);
    console.log(`- Heartbeat every ${this.config.heartbeatInterval}ms`);
    console.log(`- System info every ${this.config.systemInfoInterval}ms`);
  }

  async sendHeartbeat() {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: this.systemInfo.getAgentUptime(),
      memory: process.memoryUsage(),
      cpu: this.systemInfo.getCPUUsage()
    };

    await this.networkClient.sendHeartbeat(systemInfo);
  }

  async updateSystemInfo() {
    const systemInfo = this.systemInfo.getDetailedInfo();
    
    // Check for system issues
    this.checkSystemHealth(systemInfo);
  }

  checkSystemHealth(systemInfo) {
    // Check memory usage
    if (systemInfo.memoryUsage.percentage > 90) {
      this.errorMonitor.reportError('memory_warning', 'High memory usage', {
        usage: systemInfo.memoryUsage.percentage,
        type: 'warning'
      });
    }

    // Check CPU usage
    if (systemInfo.cpu.usage.percentage > 95) {
      this.errorMonitor.reportError('cpu_warning', 'High CPU usage', {
        usage: systemInfo.cpu.usage.percentage,
        type: 'warning'
      });
    }

    // Check disk space (simplified)
    if (systemInfo.disk.error) {
      this.errorMonitor.reportError('disk_error', 'Disk information unavailable', {
        error: systemInfo.disk.error,
        type: 'warning'
      });
    }
  }

  async handleDetectedError(errorData) {
    try {
      await this.networkClient.reportError(errorData);
      console.log('Error reported to server:', errorData.errorId);
    } catch (error) {
      console.error('Failed to report error to server:', error.message);
    }
  }

  getPCDisplayName() {
    const hostname = require('os').hostname();
    return hostname || `PC-${this.pcId.substring(0, 8)}`;
  }

  // Public methods for external control
  async forceHeartbeat() {
    if (this.isRunning) {
      await this.sendHeartbeat();
    }
  }

  async reportCustomError(errorType, message, details = {}) {
    this.errorMonitor.reportError(errorType, message, details);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      pcId: this.pcId,
      connected: this.networkClient.isConnectedToServer(),
      uptime: this.systemInfo.getAgentUptime(),
      config: this.config,
      errorStats: this.errorMonitor.getErrorStats()
    };
  }
}

// Auto-start if this file is run directly
if (require.main === module) {
  const agent = new BazookaAgent();
  
  agent.start().catch(error => {
    console.error('Failed to start agent:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    agent.stop().then(() => {
      process.exit(0);
    }).catch(error => {
      console.error('Error during shutdown:', error);
      process.exit(1);
    });
  });
}

module.exports = BazookaAgent;
