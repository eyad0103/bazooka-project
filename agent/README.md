# Bazooka PC Monitoring Agent

A lightweight, cross-platform agent that monitors your PC in real-time and sends metrics to the Bazooka Monitoring System dashboard.

## Features

- **Real-time System Monitoring**: CPU usage, memory usage, system uptime
- **Application Monitoring**: Tracks running applications with CPU and memory usage
- **Automatic Registration**: Registers your PC with the monitoring system
- **Error Reporting**: Automatically reports system errors and issues
- **Secure Communication**: Uses API keys for secure data transmission
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Low Resource Usage**: Minimal impact on system performance

## Quick Start

### Prerequisites

- Node.js 14.0 or higher
- Internet connection to reach the monitoring server

### Installation

1. **Install the agent globally:**
   ```bash
   npm install -g bazooka-agent
   ```

2. **Or install locally:**
   ```bash
   npm install
   npm start
   ```

### Usage

**Start the agent:**
```bash
bazooka-agent
```

**Check status:**
```bash
bazooka-agent --status
```

**Show help:**
```bash
bazooka-agent --help
```

## Configuration

The agent can be configured using environment variables:

```bash
BAZOOKA_SERVER=https://your-server.com bazooka-agent
HEARTBEAT_INTERVAL=30 bazooka-agent
APPS_CHECK_INTERVAL=60 bazooka-agent
PC_NAME="My-Computer" bazooka-agent
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BAZOOKA_SERVER` | `https://bazooka-project-1.onrender.com` | Backend server URL |
| `HEARTBEAT_INTERVAL` | `30` | Heartbeat interval in seconds |
| `APPS_CHECK_INTERVAL` | `60` | Apps monitoring interval in seconds |
| `PC_NAME` | System hostname | PC name for registration |

## What the Agent Monitors

### System Metrics
- CPU usage percentage
- Memory usage percentage
- Total/used/free memory
- System uptime
- Operating system information
- Network interface statistics

### Application Monitoring
- Running processes
- CPU usage per application
- Memory usage per application
- Process status (running, stopped, not responding)
- Process IDs and commands

### Error Reporting
- System errors
- Application crashes
- Performance issues
- Network connectivity problems

## Security

- **API Key Authentication**: Each PC gets a unique API key
- **Encrypted Communication**: All data sent over HTTPS
- **Local Storage**: Credentials stored securely in user home directory
- **No Personal Data**: Only system metrics and application names are collected

## Troubleshooting

### Agent Won't Start

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 14.0 or higher
   ```

2. **Check network connection:**
   ```bash
   ping bazooka-project-1.onrender.com
   ```

3. **Check logs:**
   ```bash
   tail -f agent.log
   ```

### Registration Fails

1. **Verify server URL:**
   ```bash
   BAZOOKA_SERVER=https://your-server.com bazooka-agent
   ```

2. **Check firewall settings**
3. **Try a different PC name:**
   ```bash
   PC_NAME="My-PC-$(date +%s)" bazooka-agent
   ```

### High Resource Usage

1. **Increase monitoring intervals:**
   ```bash
   HEARTBEAT_INTERVAL=60 APPS_CHECK_INTERVAL=120 bazooka-agent
   ```

2. **Check for conflicting applications**

## Development

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/bazooka-agent.git
   cd bazooka-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm start
   ```

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## Deployment

### Systemd Service (Linux)

Create `/etc/systemd/system/bazooka-agent.service`:

```ini
[Unit]
Description=Bazooka PC Monitoring Agent
After=network.target

[Service]
Type=simple
User=bazooka
ExecStart=/usr/bin/bazooka-agent
Restart=always
RestartSec=10
Environment=BAZOOKA_SERVER=https://your-server.com

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable bazooka-agent
sudo systemctl start bazooka-agent
```

### Windows Service

Use NSSM (Non-Sucking Service Manager):

```cmd
nssm install "Bazooka Agent" "C:\Program Files\nodejs\bazooka-agent.cmd"
nssm set "Bazooka Agent" AppDirectory "C:\Program Files\nodejs"
nssm set "Bazooka Agent" AppEnvironmentExtra "BAZOOKA_SERVER=https://your-server.com"
nssm start "Bazooka Agent"
```

### macOS LaunchAgent

Create `~/Library/LaunchAgents/com.bazooka.agent.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.bazooka.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/bazooka-agent</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>BAZOOKA_SERVER</key>
        <string>https://your-server.com</string>
    </dict>
</dict>
</plist>
```

Load and start:
```bash
launchctl load ~/Library/LaunchAgents/com.bazooka.agent.plist
launchctl start com.bazooka.agent
```

## Privacy

The Bazooka Agent only collects:
- System performance metrics (CPU, memory, uptime)
- Running application names and resource usage
- System information (OS version, platform)
- Error messages for troubleshooting

**No personal files, documents, or user data are collected or transmitted.**

## Support

- **Documentation**: [Full documentation](https://docs.bazooka-monitoring.com)
- **Issues**: [GitHub Issues](https://github.com/your-repo/bazooka-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/bazooka-agent/discussions)
- **Email**: support@bazooka-monitoring.com

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Bazooka PC Monitoring System** - Real-time system monitoring made simple.
