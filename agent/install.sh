#!/bin/bash

# BAZOOKA PC MONITORING AGENT INSTALLATION SCRIPT
# This script installs the Bazooka Agent on Linux/macOS

set -e

echo "🚀 Bazooka PC Monitoring Agent Installation"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14.0 or higher."
    echo "📥 Download Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 14.0 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install agent globally
echo "📦 Installing Bazooka Agent globally..."
npm install -g .

# Check if installation was successful
if command -v bazooka-agent &> /dev/null; then
    echo "✅ Bazooka Agent installed successfully!"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi

# Create systemd service file for Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🔧 Setting up systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/bazooka-agent.service"
    CURRENT_USER=$(whoami)
    
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Bazooka PC Monitoring Agent
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
ExecStart=$(which bazooka-agent)
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=BAZOOKA_SERVER=https://bazooka-project-1.onrender.com

[Install]
WantedBy=multi-user.target
EOF

    echo "✅ Systemd service created at $SERVICE_FILE"
    
    # Enable and start the service
    echo "🔄 Enabling and starting Bazooka Agent service..."
    sudo systemctl daemon-reload
    sudo systemctl enable bazooka-agent
    sudo systemctl start bazooka-agent
    
    # Check service status
    if sudo systemctl is-active --quiet bazooka-agent; then
        echo "✅ Bazooka Agent service is running!"
        echo "📊 Check status with: sudo systemctl status bazooka-agent"
        echo "🛑 Stop service with: sudo systemctl stop bazooka-agent"
        echo "📋 View logs with: sudo journalctl -u bazooka-agent -f"
    else
        echo "❌ Failed to start Bazooka Agent service"
        echo "🔍 Check logs with: sudo journalctl -u bazooka-agent"
        exit 1
    fi

# Create launch agent for macOS
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔧 Setting up macOS LaunchAgent..."
    
    LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
    LAUNCH_AGENT_FILE="$LAUNCH_AGENT_DIR/com.bazooka.agent.plist"
    
    # Create directory if it doesn't exist
    mkdir -p "$LAUNCH_AGENT_DIR"
    
    # Create LaunchAgent plist file
    tee "$LAUNCH_AGENT_FILE" > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.bazooka.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which bazooka-agent)</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>BAZOOKA_SERVER</key>
        <string>https://bazooka-project-1.onrender.com</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
    <key>StandardOutPath</key>
    <string>$HOME/.bazooka-agent.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.bazooka-agent.error.log</string>
</dict>
</plist>
EOF

    echo "✅ LaunchAgent created at $LAUNCH_AGENT_FILE"
    
    # Load and start the LaunchAgent
    echo "🔄 Loading and starting Bazooka Agent..."
    launchctl load "$LAUNCH_AGENT_FILE"
    launchctl start com.bazooka.agent
    
    echo "✅ Bazooka Agent is running on macOS!"
    echo "📊 Check status with: bazooka-agent --status"
    echo "🛑 Stop agent with: launchctl stop com.bazooka.agent"
    echo "📋 View logs with: tail -f ~/.bazooka-agent.log"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📊 Monitor your PC at: https://bazooka-project-1.onrender.com"
echo "🔑 Your PC will appear in the dashboard within a few minutes"
echo ""
echo "📋 Useful commands:"
echo "  bazooka-agent --status    # Check agent status"
echo "  bazooka-agent --help       # Show help"
echo "  bazooka-agent              # Start agent manually"
echo ""
echo "⚙️ Configuration file: ~/.bazooka-agent.json"
echo "📝 Log file: ~/.bazooka-agent.log"
echo ""
echo "🔧 To customize server URL:"
echo "  export BAZOOKA_SERVER=https://your-server.com"
echo "  bazooka-agent"
echo ""
echo "✨ Thank you for installing Bazooka PC Monitoring System!"
