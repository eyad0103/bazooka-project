# BAZOOKA PC MONITORING SYSTEM

A Node.js backend system for monitoring multiple PCs with real-time status tracking, error reporting, and heartbeat management.

## Features

- **PC Registration**: Register PCs with unique API keys
- **Heartbeat Monitoring**: Track PC status with periodic heartbeats
- **Error Reporting**: Collect and view errors from monitored PCs
- **Real-time Status**: Monitor online/offline status of all PCs

## API Endpoints

### Core Endpoints
- `GET /` - System information and available endpoints
- `POST /register-pc` - Register a new PC
- `POST /heartbeat` - Send heartbeat from a PC
- `POST /report-error` - Report an error from a PC
- `GET /errors` - Get recent errors
- `GET /pcs` - Get all registered PCs

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Usage Examples

### Register a PC
```bash
curl -X POST http://localhost:3000/register-pc \
  -H "Content-Type: application/json" \
  -d '{"pcName": "My-Computer"}'
```

### Send Heartbeat
```bash
curl -X POST http://localhost:3000/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-api-key", "status": "ONLINE"}'
```

### Report Error
```bash
curl -X POST http://localhost:3000/report-error \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-api-key", "errorType": "CRASH", "message": "Application crashed"}'
```

## Project Status

✅ **Phase 1**: Project Foundation - Complete
✅ **Phase 2**: PC Registration & API Keys - Complete  
✅ **Phase 3**: Heartbeat & Status Tracking - Complete
✅ **Phase 4**: Error Reporting - Complete
🔄 **Phase 5**: Web Dashboard - Pending
🔄 **Phase 6**: Application Monitoring - Pending
🔄 **Phase 7**: Advanced Features - Pending

## Render Deployment

**Build Command**: `npm install`
**Start Command**: `npm start`
**Environment Variables**:
```
NODE_ENV=production
PORT=10000
```
