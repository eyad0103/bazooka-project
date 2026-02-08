#!/usr/bin/env node

/**
 * BAZOOKA PC MONITORING SYSTEM - AGENT CLIENT
 * Real-time PC monitoring agent that sends system metrics to the backend
 */

const axios = require('axios');
const si = require('systeminformation');
const cron = require('node-cron');
const winston = require('winston');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'agent.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class BazookaAgent {
  constructor() {
    this.config = this.loadConfig();
    this.apiKey = null;
    this.pcId = null;
    this.serverUrl = this.config.serverUrl || 'https://bazooka-project-1.onrender.com';
    this.heartbeatInterval = null;
    this.appsCheckInterval = null;
    this.isRunning = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    
    logger.info('Bazooka Agent initialized');
  }

  loadConfig() {
    const configPath = path.join(os.homedir(), '.bazooka-agent.json');
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      logger.warn('Could not load config file, using defaults');
    }
    
    return {
      serverUrl: process.env.BAZOOKA_SERVER || 'https://bazooka-project-1.onrender.com',
      heartbeatInterval: process.env.HEARTBEAT_INTERVAL || 30, // seconds
      appsCheckInterval: process.env.APPS_CHECK_INTERVAL || 60, // seconds
      pcName: process.env.PC_NAME || os.hostname()
    };
  }

  saveConfig() {
    const configPath = path.join(os.homedir(), '.bazooka-agent.json');
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      logger.info('Configuration saved');
    } catch (error) {
      logger.error('Failed to save config:', error);
    }
  }

  async registerPC() {
    try {
      logger.info(`Registering PC: ${this.config.pcName}`);
      
      const response = await axios.post(`${this.serverUrl}/register-pc`, {
        pcName: this.config.pcName
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bazooka-Agent/1.0.0'
        }
      });

      if (response.data && response.data.apiKey) {
        this.apiKey = response.data.apiKey;
        this.pcId = response.data.pcId || response.data.id;
        
        // Save credentials
        this.config.apiKey = this.apiKey;
        this.config.pcId = this.pcId;
        this.saveConfig();
        
        logger.info(`PC registered successfully. PC ID: ${this.pcId}`);
        console.log(`✅ PC "${this.config.pcName}" registered successfully!`);
        console.log(`🔑 API Key: ${this.apiKey}`);
        console.log(`🆔 PC ID: ${this.pcId}`);
        
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      logger.error('Registration failed:', error.message);
      console.error(`❌ Registration failed: ${error.message}`);
      return false;
    }
  }

  async getSystemMetrics() {
    try {
      const [cpu, memory, osInfo, network] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.osInfo(),
        si.networkStats()
      ]);

      return {
        cpu: Math.round(cpu.currentLoad),
        memory: Math.round((memory.used / memory.total) * 100),
        totalMemory: Math.round(memory.total / 1024 / 1024 / 1024), // GB
        usedMemory: Math.round(memory.used / 1024 / 1024 / 1024), // GB
        freeMemory: Math.round(memory.free / 1024 / 1024 / 1024), // GB
        platform: osInfo.platform,
        os: `${osInfo.distro} ${osInfo.release}`,
        uptime: osInfo.uptime,
        networkInterfaces: network.map(net => ({
          iface: net.iface,
          rx_bytes: net.rx_bytes,
          tx_bytes: net.tx_bytes
        }))
      };
    } catch (error) {
      logger.error('Failed to get system metrics:', error);
      return null;
    }
  }

  async getRunningApps() {
    try {
      const processes = await si.processes();
      const apps = [];

      // Focus on significant processes (exclude system processes with low CPU/memory)
      const significantProcesses = processes.list.filter(proc => 
        proc.pcpu > 0.1 || proc.pmem > 0.1 || proc.name === 'node' || proc.name === 'chrome' || 
        proc.name === 'firefox' || proc.name === 'code' || proc.name === 'steam'
      ).slice(0, 20); // Limit to top 20 processes

      for (const proc of significantProcesses) {
        apps.push({
          name: proc.name,
          pid: proc.pid,
          status: proc.state === 'running' ? 'RUNNING' : 
                  proc.state === 'sleeping' ? 'RUNNING' : 
                  proc.state === 'zombie' ? 'NOT_RESPONDING' : 'STOPPED',
          cpuUsage: Math.round(proc.pcpu * 10) / 10,
          memoryUsage: Math.round(proc.pmem * 10) / 10,
          memoryMB: Math.round(proc.mem / 1024 / 1024),
          command: proc.command,
          startedAt: proc.started
        });
      }

      return apps;
    } catch (error) {
      logger.error('Failed to get running apps:', error);
      return [];
    }
  }

  async sendHeartbeat() {
    if (!this.apiKey) {
      logger.error('No API key available for heartbeat');
      return false;
    }

    try {
      const metrics = await this.getSystemMetrics();
      if (!metrics) {
        throw new Error('Failed to collect system metrics');
      }

      const status = metrics.cpu > 90 ? 'WAITING' : 'ONLINE';
      
      const payload = {
        apiKey: this.apiKey,
        status: status,
        cpu: metrics.cpu,
        memory: metrics.memory,
        timestamp: new Date().toISOString(),
        uptime: metrics.uptime,
        platform: metrics.platform,
        os: metrics.os
      };

      const response = await axios.post(`${this.serverUrl}/heartbeat`, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Bazooka-Agent/1.0.0'
        }
      });

      logger.info(`Heartbeat sent successfully. CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%`);
      this.retryCount = 0; // Reset retry count on success
      return true;
    } catch (error) {
      logger.error('Heartbeat failed:', error.message);
      this.retryCount++;
      
      if (this.retryCount >= this.maxRetries) {
        logger.error('Max retries reached, stopping agent');
        this.stop();
      }
      
      return false;
    }
  }

  async sendAppsStatus() {
    if (!this.apiKey) {
      logger.error('No API key available for apps status');
      return false;
    }

    try {
      const apps = await this.getRunningApps();
      
      const payload = {
        apiKey: this.apiKey,
        applications: apps.map(app => ({
          name: app.name,
          status: app.status,
          version: null, // Could be enhanced to get version info
          memoryUsage: app.memoryMB > 0 ? `${app.memoryMB} MB` : null,
          cpuUsage: app.cpuUsage > 0 ? `${app.cpuUsage}%` : null,
          pid: app.pid,
          command: app.command
        }))
      };

      const response = await axios.post(`${this.serverUrl}/apps-status`, payload, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Bazooka-Agent/1.0.0'
        }
      });

      logger.info(`Apps status sent successfully. ${apps.length} applications monitored`);
      return true;
    } catch (error) {
      logger.error('Apps status failed:', error.message);
      return false;
    }
  }

  async reportError(errorType, message, severity = 'WARNING') {
    if (!this.apiKey) {
      logger.error('No API key available for error reporting');
      return false;
    }

    try {
      const payload = {
        apiKey: this.apiKey,
        errorType: severity,
        message: message,
        timestamp: new Date().toISOString(),
        details: {
          agentVersion: '1.0.0',
          platform: os.platform(),
          nodeVersion: process.version
        }
      };

      const response = await axios.post(`${this.serverUrl}/report-error`, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Bazooka-Agent/1.0.0'
        }
      });

      logger.info(`Error reported: ${severity} - ${message}`);
      return true;
    } catch (error) {
      logger.error('Error reporting failed:', error.message);
      return false;
    }
  }

  startHeartbeat() {
    const intervalSeconds = this.config.heartbeatInterval || 30;
    
    // Send first heartbeat immediately
    this.sendHeartbeat();
    
    // Set up recurring heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, intervalSeconds * 1000);

    logger.info(`Heartbeat started (every ${intervalSeconds} seconds)`);
  }

  startAppsMonitoring() {
    const intervalSeconds = this.config.appsCheckInterval || 60;
    
    // Send first apps status immediately
    this.sendAppsStatus();
    
    // Set up recurring apps check
    this.appsCheckInterval = setInterval(() => {
      this.sendAppsStatus();
    }, intervalSeconds * 1000);

    logger.info(`Apps monitoring started (every ${intervalSeconds} seconds)`);
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Agent is already running');
      return;
    }

    console.log('🚀 Starting Bazooka Agent...');
    console.log(`📡 Server: ${this.serverUrl}`);
    console.log(`💻 PC Name: ${this.config.pcName}`);

    // Try to load existing credentials
    if (this.config.apiKey && this.config.pcId) {
      this.apiKey = this.config.apiKey;
      this.pcId = this.config.pcId;
      logger.info('Loaded existing credentials');
      console.log('✅ Using existing credentials');
    } else {
      // Register new PC
      const registered = await this.registerPC();
      if (!registered) {
        logger.error('Failed to register PC, exiting');
        console.error('❌ Failed to register PC. Please check your connection and try again.');
        process.exit(1);
      }
    }

    // Start monitoring
    this.startHeartbeat();
    this.startAppsMonitoring();
    
    this.isRunning = true;
    logger.info('Bazooka Agent started successfully');
    console.log('✅ Bazooka Agent is now monitoring your PC!');
    console.log('📊 Sending metrics to dashboard...');
    console.log('🛑 Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('\n🛑 Stopping Bazooka Agent...');
    logger.info('Stopping agent');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.appsCheckInterval) {
      clearInterval(this.appsCheckInterval);
    }

    this.isRunning = false;
    logger.info('Bazooka Agent stopped');
    console.log('✅ Agent stopped gracefully');
    
    process.exit(0);
  }

  async status() {
    console.log('📊 Bazooka Agent Status:');
    console.log(`🔑 API Key: ${this.apiKey ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🆔 PC ID: ${this.pcId || 'Not registered'}`);
    console.log(`📡 Server: ${this.serverUrl}`);
    console.log(`💻 PC Name: ${this.config.pcName}`);
    console.log(`💓 Heartbeat: ${this.heartbeatInterval ? '✅ Running' : '❌ Stopped'}`);
    console.log(`📱 Apps Monitor: ${this.appsCheckInterval ? '✅ Running' : '❌ Stopped'}`);
    
    if (this.apiKey) {
      try {
        const metrics = await this.getSystemMetrics();
        if (metrics) {
          console.log(`\n📈 Current Metrics:`);
          console.log(`   CPU Usage: ${metrics.cpu}%`);
          console.log(`   Memory Usage: ${metrics.memory}%`);
          console.log(`   OS: ${metrics.os}`);
          console.log(`   Uptime: ${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`);
        }
      } catch (error) {
        console.log(`❌ Could not fetch current metrics: ${error.message}`);
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const agent = new BazookaAgent();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Bazooka PC Monitoring Agent

Usage:
  bazooka-agent [options]

Options:
  --help, -h     Show this help message
  --status, -s   Show agent status
  --start        Start the agent (default)
  --stop         Stop the agent
  --config       Show configuration

Environment Variables:
  BAZOOKA_SERVER        Backend server URL
  HEARTBEAT_INTERVAL    Heartbeat interval in seconds (default: 30)
  APPS_CHECK_INTERVAL   Apps check interval in seconds (default: 60)
  PC_NAME               PC name for registration

Examples:
  bazooka-agent                    # Start agent with default settings
  bazooka-agent --status           # Show current status
  BAZOOKA_SERVER=http://localhost:3000 bazooka-agent  # Use local server
`);
    process.exit(0);
  }

  if (args.includes('--status') || args.includes('-s')) {
    await agent.status();
    process.exit(0);
  }

  if (args.includes('--config')) {
    console.log('Configuration:');
    console.log(JSON.stringify(agent.config, null, 2));
    process.exit(0);
  }

  if (args.includes('--stop')) {
    console.log('Agent is not running as a service. Use Ctrl+C to stop.');
    process.exit(0);
  }

  // Default action: start the agent
  await agent.start();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('💥 Uncaught error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  console.error('💥 Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the agent
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Failed to start agent:', error.message);
    process.exit(1);
  });
}

module.exports = BazookaAgent;
