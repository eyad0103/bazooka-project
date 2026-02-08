# BAZOOKA PC MONITORING SYSTEM

=====================================================
FULL SYSTEM COPYABLE SETUP
=====================================================

## 🚀 PROJECT STRUCTURE
```
bazooka-project/
│
├─ backend/
│   ├─ server.js          # Express backend server
│   ├─ package.json       # Backend dependencies
│   ├─ routes/
│   │   ├─ pcs.js         # PC registration endpoints
│   │   ├─ heartbeat.js   # Heartbeat endpoints
│   │   ├─ errors.js      # Error reporting endpoints
│   │   └─ apps.js        # Application monitoring endpoints
│   └─ models/
│       ├─ PC.js          # PC data model
│       ├─ Error.js       # Error data model
│       └─ App.js         # Application data model
│
├─ frontend/
│   ├─ index.html         # Dashboard HTML
│   ├─ styles.css         # Futuristic neon theme
│   └─ app.js             # Frontend JavaScript
│
└─ agent/
    ├─ agent.js           # Node.js agent script for real PCs
    ├─ package.json       # Agent dependencies
    ├─ install.sh         # Linux/macOS installation script
    └─ install.bat        # Windows installation script
```

---

## 🛠️ QUICK START

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Frontend
The frontend is served automatically by the backend at `http://localhost:3000`

### 3. Agent Installation
```bash
cd agent
npm install
npm install -g .
bazooka-agent
```

---

## 📋 FEATURES

### ✅ **Real-time PC Monitoring**
- Live CPU and memory usage tracking
- Application status monitoring
- Error reporting and alerting
- Heartbeat status updates

### ✅ **Futuristic Dashboard**
- Neon-themed dark interface
- Real-time data updates
- Tabbed navigation (Dashboard, Errors, Apps, Settings)
- Responsive design for all devices

### ✅ **Cross-platform Agent**
- Windows, macOS, and Linux support
- Automatic PC registration
- Configurable monitoring intervals
- Graceful error handling

### ✅ **Production Ready**
- RESTful API endpoints
- In-memory storage (easily upgradeable to database)
- Comprehensive error handling
- Logging and monitoring

---

## 🔧 API ENDPOINTS

### PC Management
- `POST /pcs` - Register new PC
- `GET /pcs` - Get all registered PCs
- `GET /pcs/:apiKey` - Get specific PC

### Heartbeat
- `POST /heartbeat` - Send PC heartbeat

### Error Reporting
- `POST /errors` - Report system error
- `GET /errors` - Get all errors
- `GET /errors/pc/:pcId` - Get PC-specific errors

### Application Monitoring
- `POST /apps-status` - Update application status
- `GET /apps-status` - Get all applications
- `GET /apps-status/pc/:pcId` - Get PC-specific apps

---

## 🎯 USAGE EXAMPLES

### Register a PC
```bash
curl -X POST http://localhost:3000/pcs \
  -H "Content-Type: application/json" \
  -d '{"name": "My-PC"}'
```

### Send Heartbeat
```bash
curl -X POST http://localhost:3000/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "status": "ONLINE",
    "cpu": 45,
    "memory": 62,
    "uptime": 3600
  }'
```

### Report Error
```bash
curl -X POST http://localhost:3000/errors \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "type": "WARNING",
    "message": "High CPU usage detected",
    "details": "CPU usage exceeded 80% threshold"
  }'
```

---

## 🎨 FRONTEND FEATURES

### Dashboard
- Real-time PC status cards
- System statistics overview
- Live data updates every 2 seconds
- PC registration interface

### Error Monitoring
- Categorized error display (Critical, Warning, Info)
- Error filtering and search
- Timestamp and PC information
- Clear error functionality

### Application Tracking
- Running applications per PC
- Resource usage monitoring
- Application status indicators
- PC-specific filtering

### Settings
- Configurable refresh rates
- Alert threshold settings
- Theme customization
- Settings persistence

---

## 🤖 AGENT FEATURES

### Automatic Registration
- Unique API key generation
- Hostname-based PC identification
- Server communication setup

### System Monitoring
- CPU usage tracking
- Memory usage monitoring
- Application detection
- Uptime tracking

### Error Reporting
- Automatic error detection
- Categorized error reporting
- Detailed error information
- Real-time error transmission

### Configuration
- Environment variable support
- Custom server URLs
- Configurable intervals
- Graceful shutdown handling

---

## 📦 DEPLOYMENT

### Local Development
```bash
# Backend
cd backend
npm install
npm start

# Agent (in separate terminal)
cd agent
npm install
npm install -g .
bazooka-agent
```

### Production Deployment
```bash
# Set environment variables
export PORT=3000
export BAZOOKA_SERVER=http://your-server.com

# Start backend
cd backend
npm install
npm start

# Install agent on target PCs
cd agent
npm install -g .
bazooka-agent
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔧 CONFIGURATION

### Backend Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode

### Agent Environment Variables
- `BAZOOKA_SERVER` - Backend server URL (default: http://localhost:3000)

### Frontend Settings
- Refresh rate: 1-60 seconds
- Alert threshold: Low, Medium, High
- Theme: Futuristic, Classic, Dark
- Animations: On/Off

---

## 🛡️ SECURITY

### API Key Authentication
- Unique API keys for each PC
- Secure key generation
- Request validation

### Data Protection
- Input sanitization
- Error handling
- CORS configuration

### Monitoring
- Request logging
- Error tracking
- Performance metrics

---

## 🎯 KEYBOARD SHORTCUTS

### Navigation
- `Alt+1` - Dashboard tab
- `Alt+2` - Errors tab
- `Alt+3` - Apps tab
- `Alt+4` - Settings tab

### Actions
- `Enter` - Register PC (when in name field)
- `Ctrl+S` - Save settings
- `Ctrl+R` - Reset settings

---

## 📊 MONITORING METRICS

### PC Metrics
- CPU usage percentage
- Memory usage percentage
- System uptime
- Last heartbeat timestamp
- Online/offline status

### Application Metrics
- Application name and version
- Running status
- CPU usage per app
- Memory usage per app
- Last update timestamp

### Error Metrics
- Error type (Critical, Warning, Info)
- Error message and details
- Timestamp
- PC identification
- Resolution status

---

## 🚀 PERFORMANCE

### Scalability
- Supports multiple simultaneous PCs
- Efficient data structures
- Minimal resource usage
- Fast response times

### Reliability
- Automatic reconnection
- Error recovery
- Graceful degradation
- Comprehensive logging

### Optimization
- Minimal dependencies
- Efficient algorithms
- Memory management
- Network optimization

---

## 🤝 CONTRIBUTING

### Development Setup
```bash
git clone https://github.com/eyad0103/bazooka-project.git
cd bazooka-project
cd backend && npm install
cd ../agent && npm install
```

### Code Style
- Use ES6+ features
- Follow consistent naming conventions
- Add comprehensive comments
- Include error handling

### Testing
- Test all endpoints
- Verify agent functionality
- Check frontend responsiveness
- Validate error scenarios

---

## 📄 LICENSE

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🆘 SUPPORT

### Common Issues
1. **Agent won't register**: Check server URL and network connectivity
2. **Dashboard not updating**: Verify agent is running and sending heartbeats
3. **Errors not showing**: Ensure error reporting is enabled in agent

### Troubleshooting
- Check backend logs for API errors
- Verify agent configuration
- Test network connectivity
- Review environment variables

### Getting Help
- Check the console for error messages
- Verify all services are running
- Test API endpoints individually
- Review configuration files

---

## 🎉 SUCCESS CRITERIA

✅ **Working Backend**: Express server with all endpoints  
✅ **Functional Frontend**: Dashboard with real-time updates  
✅ **Active Agent**: PC monitoring and reporting  
✅ **Data Flow**: End-to-end data transmission  
✅ **User Interface**: Intuitive and responsive design  
✅ **Error Handling**: Comprehensive error management  
✅ **Documentation**: Complete setup and usage guide  

---

**🚀 Your Bazooka PC Monitoring System is ready for deployment!**

Visit `http://localhost:3000` to access your dashboard and start monitoring PCs in real-time.
