# Bazooka PC Monitoring Agent

## Overview

The Bazooka Agent is a lightweight Node.js application that monitors PC systems and reports data to the Bazooka Monitoring System backend.

## Features

- **Automatic PC Registration** - Generates unique PC ID and registers with backend
- **Real-time Monitoring** - Sends heartbeat every 30 seconds
- **Error Detection** - Automatically detects and reports system errors
- **System Information** - Collects CPU, memory, OS, and network data
- **Network Resilience** - Auto-reconnects to backend if connection is lost
- **Plug-and-Play** - Works on fresh PCs with no manual setup required

## Quick Start

### Windows
1. Copy the entire `agent` folder to the target PC
2. Double-click `run-agent.bat`
3. The agent will automatically install dependencies and start

### macOS/Linux
1. Copy the entire `agent` folder to the target PC
2. Open terminal and run: `chmod +x run-agent.command && ./run-agent.command`
3. The agent will automatically install dependencies and start

## Requirements

- **Node.js 18+** - Download from https://nodejs.org/
- **Network Connection** - Must be able to reach the backend server
- **Backend URL** - Configure in `config.json` if needed

## Configuration

Edit `config.json` to customize:

```json
{
  "pcId": "",                    // Auto-generated, don't edit
  "serverUrl": "http://localhost:3000",
  "heartbeatInterval": 30000,       // 30 seconds
  "errorCheckInterval": 5000,         // 5 seconds
  "systemInfoInterval": 60000,      // 1 minute
  "logging": {
    "level": "info",
    "maxFileSize": "10MB",
    "maxFiles": 5
  },
  "features": {
    "autoStart": false,
    "minimizeToTray": true,
    "startWithSystem": false
  }
}
```

## Files

- `agent.js` - Main agent logic
- `config.json` - Configuration file
- `utils/systemInfo.js` - System information collection
- `utils/errorMonitor.js` - Error detection and reporting
- `utils/network.js` - Backend communication
- `run-agent.bat` - Windows launcher
- `run-agent.command` - macOS/Linux launcher
- `logs/` - Log files directory

## Troubleshooting

### Agent won't start
1. Check Node.js is installed: `node --version`
2. Verify network connection to backend
3. Check `logs/agent.log` for error details

### Dependencies not found
The launcher scripts automatically install dependencies. If this fails:
1. Open command prompt/terminal in the agent directory
2. Run: `npm install`
3. Try starting again

### Backend connection issues
1. Verify `serverUrl` in `config.json`
2. Check network connectivity
3. Verify backend is running and accessible

## Security

- All network communication uses HTTPS when available
- API keys are never exposed to the agent
- Error data is sanitized before transmission
- Local logs are stored securely

## Support

For issues or questions:
1. Check the agent logs in the `logs/` directory
2. Contact system administrator
3. Review backend dashboard for error details
