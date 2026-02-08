const os = require('os');
const fs = require('fs');
const path = require('path');

class SystemInfo {
  constructor() {
    this.startTime = Date.now();
  }

  getBasicInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      uptime: os.uptime(),
      nodeVersion: process.version
    };
  }

  getDetailedInfo() {
    const basic = this.getBasicInfo();
    const loadAvg = os.loadavg();
    const cpus = os.cpus();
    
    return {
      ...basic,
      memoryUsage: {
        total: basic.totalMemory,
        free: basic.freeMemory,
        used: basic.totalMemory - basic.freeMemory,
        percentage: ((basic.totalMemory - basic.freeMemory) / basic.totalMemory * 100).toFixed(2)
      },
      cpu: {
        model: basic.cpuModel,
        cores: basic.cpuCount,
        loadAverage: loadAvg,
        usage: this.getCPUUsage()
      },
      os: {
        type: os.type(),
        release: os.release(),
        platform: os.platform(),
        arch: os.arch()
      },
      network: this.getNetworkInfo(),
      disk: this.getDiskInfo(),
      processes: this.getProcessInfo()
    };
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      percentage: ((totalTick - totalIdle) / totalTick * 100).toFixed(2)
    };
  }

  getNetworkInfo() {
    const networkInterfaces = os.networkInterfaces();
    const interfaces = {};

    for (const [name, configs] of Object.entries(networkInterfaces)) {
      interfaces[name] = configs.map(config => ({
        family: config.family,
        address: config.address,
        netmask: config.netmask,
        internal: config.internal,
        mac: config.mac
      }));
    }

    return interfaces;
  }

  getDiskInfo() {
    try {
      const stats = fs.statSync(process.cwd());
      return {
        available: 'N/A', // Would require additional library for detailed disk info
        total: 'N/A',
        used: 'N/A'
      };
    } catch (error) {
      return {
        available: 'N/A',
        total: 'N/A',
        used: 'N/A',
        error: error.message
      };
    }
  }

  getProcessInfo() {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      version: process.version,
      title: process.title
    };
  }

  getAgentUptime() {
    return Date.now() - this.startTime;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
}

module.exports = SystemInfo;
