const axios = require('axios');
const os = require('os');

// Configuration
const SERVER_URL = process.env.BAZOOKA_SERVER || 'http://localhost:3000';
const PC_NAME = os.hostname();
let API_KEY = '';

// Agent state
let isRunning = true;
let heartbeatInterval;
let appsInterval;

// Register PC with server
async function registerPC() {
  try {
    console.log(`🚀 Registering PC: ${PC_NAME}`);
    
    const response = await axios.post(`${SERVER_URL}/pcs`, { 
      name: PC_NAME 
    });
    
    API_KEY = response.data.apiKey;
    console.log(`✅ PC registered successfully!`);
    console.log(`📋 PC Name: ${PC_NAME}`);
    console.log(`🔑 API Key: ${API_KEY}`);
    console.log(`🆔 PC ID: ${response.data.pcId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to register PC:', error.message);
    return false;
  }
}

// Send heartbeat to server
async function sendHeartbeat() {
  if (!API_KEY) return;
  
  try {
    // Get system metrics
    const cpuUsage = Math.floor(Math.random() * 100); // Simulated CPU usage
    const memoryUsage = Math.floor(Math.random() * 100); // Simulated memory usage
    const uptime = os.uptime();
    
    const response = await axios.post(`${SERVER_URL}/heartbeat`, {
      apiKey: API_KEY,
      status: 'ONLINE',
      cpu: cpuUsage,
      memory: memoryUsage,
      uptime: uptime
    });
    
    console.log(`💓 Heartbeat sent - CPU: ${cpuUsage}%, Memory: ${memoryUsage}%`);
  } catch (error) {
    console.error('❌ Failed to send heartbeat:', error.message);
  }
}

// Get running applications (simplified version)
function getRunningApps() {
  // In a real implementation, you would use systeminformation or similar
  // For now, return some example apps
  return [
    {
      name: 'Chrome',
      status: 'RUNNING',
      version: '120.0.6099',
      cpuUsage: `${Math.floor(Math.random() * 30)}%`,
      memoryUsage: `${Math.floor(Math.random() * 1000)} MB`
    },
    {
      name: 'VS Code',
      status: 'RUNNING', 
      version: '1.85.0',
      cpuUsage: `${Math.floor(Math.random() * 20)}%`,
      memoryUsage: `${Math.floor(Math.random() * 500)} MB`
    },
    {
      name: 'Node.js',
      status: 'RUNNING',
      version: '20.10.0',
      cpuUsage: `${Math.floor(Math.random() * 15)}%`,
      memoryUsage: `${Math.floor(Math.random() * 200)} MB`
    }
  ];
}

// Send application status to server
async function sendApps() {
  if (!API_KEY) return;
  
  try {
    const apps = getRunningApps();
    
    const response = await axios.post(`${SERVER_URL}/apps-status`, {
      apiKey: API_KEY,
      apps: apps.map(app => ({
        ...app,
        pcName: PC_NAME
      }))
    });
    
    console.log(`📱 Apps status sent - ${apps.length} applications`);
  } catch (error) {
    console.error('❌ Failed to send apps status:', error.message);
  }
}

// Report error to server
async function reportError(type, message, details = null) {
  if (!API_KEY) return;
  
  try {
    const response = await axios.post(`${SERVER_URL}/errors`, {
      apiKey: API_KEY,
      type: type,
      message: message,
      details: details
    });
    
    console.log(`⚠️ Error reported: ${type} - ${message}`);
  } catch (error) {
    console.error('❌ Failed to report error:', error.message);
  }
}

// Start monitoring
async function startMonitoring() {
  console.log(`🎯 Starting Bazooka PC Monitoring Agent...`);
  console.log(`🌐 Server: ${SERVER_URL}`);
  console.log(`💻 PC: ${PC_NAME}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('');
  
  // Register PC
  const registered = await registerPC();
  if (!registered) {
    console.error('❌ Failed to register PC. Exiting...');
    process.exit(1);
  }
  
  console.log('');
  console.log('🔄 Starting monitoring loops...');
  console.log('💓 Heartbeat: every 5 seconds');
  console.log('📱 Apps check: every 10 seconds');
  console.log('');
  
  // Start heartbeat interval
  heartbeatInterval = setInterval(sendHeartbeat, 5000);
  
  // Start apps monitoring interval
  appsInterval = setInterval(sendApps, 10000);
  
  // Send initial data
  await sendHeartbeat();
  await sendApps();
  
  // Simulate some errors for demonstration
  setTimeout(() => {
    reportError('WARNING', 'High CPU usage detected', 'CPU usage exceeded 80% threshold');
  }, 30000);
  
  setTimeout(() => {
    reportError('INFO', 'System update available', 'New security patches are available');
  }, 60000);
  
  console.log('✅ Monitoring agent is running successfully!');
  console.log('🛑 Press Ctrl+C to stop');
}

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down Bazooka Agent...');
  
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (appsInterval) clearInterval(appsInterval);
  
  // Report shutdown
  reportError('INFO', 'Agent shutdown', 'Bazooka monitoring agent stopped gracefully');
  
  console.log('👋 Goodbye!');
  process.exit(0);
}

// Handle process signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  reportError('CRITICAL', 'Uncaught exception', error.message);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  reportError('CRITICAL', 'Unhandled rejection', reason);
  shutdown();
});

// Start the agent
if (require.main === module) {
  startMonitoring().catch(error => {
    console.error('💥 Failed to start agent:', error);
    process.exit(1);
  });
}

module.exports = {
  registerPC,
  sendHeartbeat,
  sendApps,
  reportError,
  startMonitoring
};
