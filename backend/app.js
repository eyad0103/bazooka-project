const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const config = require('./config/config');

// Import routes
const healthRoutes = require('./routes/health.routes');
const pcsRoutes = require('./routes/pcs.routes');
const errorsRoutes = require('./routes/errors.routes');
const aiRoutes = require('./routes/ai.routes');
const settingsRoutes = require('./routes/settings.routes');

/**
 * Create Express App
 */
const app = express();

// Middleware
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static frontend files
app.use(express.static(path.resolve(__dirname, '../frontend')));

// API routes (must come before catch-all)
app.use('/api', healthRoutes);
app.use('/api/pcs', pcsRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// Catch-all for SPA (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
