@echo off
REM BAZOOKA PC MONITORING AGENT INSTALLATION SCRIPT
REM This script installs the Bazooka Agent on Windows

echo.
echo 🚀 Bazooka PC Monitoring Agent Installation
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14.0 or higher.
    echo 📥 Download Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%

REM Install agent globally
echo.
echo 📦 Installing Bazooka Agent globally...
npm install -g .

if %errorlevel% neq 0 (
    echo ❌ Installation failed. Please check the error messages above.
    pause
    exit /b 1
)

REM Check if installation was successful
bazooka-agent --help >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Installation failed. Please check the error messages above.
    pause
    exit /b 1
)

echo ✅ Bazooka Agent installed successfully!

REM Create Windows service using NSSM
echo.
echo 🔧 Setting up Windows service...
echo.

REM Check if NSSM is available
nssm version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  NSSM (Non-Sucking Service Manager) not found.
    echo 📥 Please download and install NSSM from: https://nssm.cc/download
    echo 📄 Extract and place nssm.exe in your PATH or in this directory.
    echo.
    echo 💡 Alternative: Run the agent manually with: bazooka-agent
    echo.
    pause
    goto :manual_start
)

REM Create Windows service
echo 🔄 Creating Windows service...
nssm install "Bazooka Agent" "%APPDATA%\npm\bazooka-agent.cmd"
nssm set "Bazooka Agent" AppDirectory "%APPDATA%\npm"
nssm set "Bazooka Agent" AppEnvironmentExtra "BAZOOKA_SERVER=https://bazooka-project-1.onrender.com"
nssm set "Bazooka Agent" AppEnvironmentExtra "NODE_ENV=production"
nssm set "Bazooka Agent" DisplayName "Bazooka PC Monitoring Agent"
nssm set "Bazooka Agent" Description "Monitors PC performance and sends data to Bazooka dashboard"
nssm set "Bazooka Agent" Start SERVICE_AUTO_START

REM Start the service
echo 🚀 Starting Bazooka Agent service...
nssm start "Bazooka Agent"

if %errorlevel% neq 0 (
    echo ❌ Failed to start Bazooka Agent service
    echo 🔍 Check Windows Event Viewer for details
    pause
    exit /b 1
)

echo ✅ Bazooka Agent service is running!
echo 📊 Check status in Services app or with: sc query "Bazooka Agent"
echo 🛑 Stop service with: nssm stop "Bazooka Agent"
echo 🗑️  Remove service with: nssm remove "Bazooka Agent"
goto :end

:manual_start
echo.
echo 🔄 Starting Bazooka Agent manually...
echo 💡 The agent will run in this window. Close this window to stop it.
echo.
start /min bazooka-agent

:end
echo.
echo 🎉 Installation completed successfully!
echo.
echo 📊 Monitor your PC at: https://bazooka-project-1.onrender.com
echo 🔑 Your PC will appear in the dashboard within a few minutes
echo.
echo 📋 Useful commands:
echo   bazooka-agent --status    # Check agent status
echo   bazooka-agent --help       # Show help
echo   bazooka-agent              # Start agent manually
echo.
echo ⚙️ Configuration file: %USERPROFILE%\.bazooka-agent.json
echo 📝 Log file: agent.log
echo.
echo 🔧 To customize server URL:
echo   set BAZOOKA_SERVER=https://your-server.com
echo   bazooka-agent
echo.
echo ✨ Thank you for installing Bazooka PC Monitoring System!
echo.
pause
