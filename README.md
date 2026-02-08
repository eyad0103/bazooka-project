# Bazooka Project

A Node.js web service built with Express.js, ready for deployment on Render.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. For development with auto-reload:
   ```bash
   npm run dev
   ```

## Render Deployment Settings

**Name**: `bazooka-project` (or your preferred name)

**Language**: `Node`

**Build Command**: `npm install`

**Start Command**: `npm start`

**Instance Type**: 
- **Free**: Good for testing/hobby
- **Standard ($7/month)**: Recommended for production

**Environment Variables**:
```
NODE_ENV=production
PORT=10000
```

**Root Directory**: Leave empty (uses repo root)

**Branch**: `main` (or your default branch)

**Region**: Oregon (US West) - matches your existing services

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api` - API information

## Project Structure

```
bazooka-project/
├── index.js          # Main server file
├── package.json      # Dependencies and scripts
├── .env.example      # Environment variables template
├── .gitignore        # Git ignore file
└── README.md         # This file
```
