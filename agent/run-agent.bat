@echo off
title Bazooka PC Monitoring Agent
echo Starting Bazooka PC Monitoring Agent...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "agent.js" (
    echo Error: agent.js not found
    echo Please run this script from the agent directory
    pause
    exit /b 1
)

REM Check and install dependencies
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed
)

REM Create logs directory if it doesn't exist
if not exist "logs" (
    mkdir logs
    echo Created logs directory
)

REM Start the agent
echo Starting agent...
node agent.js

REM Check if agent exited with error
if %errorlevel% neq 0 (
    echo.
    echo Agent exited with error code %errorlevel%
    echo Check the logs directory for details
    pause
) else (
    echo.
    echo Agent stopped successfully
)

pause
