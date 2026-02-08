#!/bin/bash

# Bazooka PC Monitoring Agent Launcher for macOS/Linux

echo "Starting Bazooka PC Monitoring Agent..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "agent.js" ]; then
    echo "Error: agent.js not found"
    echo "Please run this script from the agent directory"
    read -p "Press Enter to exit..."
    exit 1
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir logs
    echo "Created logs directory"
fi

# Start the agent
echo "Starting agent..."
node agent.js

# Check if agent exited with error
if [ $? -ne 0 ]; then
    echo
    echo "Agent exited with error"
    echo "Check the logs directory for details"
else
    echo
    echo "Agent stopped successfully"
fi

read -p "Press Enter to exit..."
