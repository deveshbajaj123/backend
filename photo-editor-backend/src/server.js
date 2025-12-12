require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const multer = require('multer');

// Import routes
const authRoutes = require('./routes/authRoutes');
const photoRoutes = require('./routes/photoRoutes');
const albumRoutes = require('./routes/albumRoutes');
const imageRoutes = require('./routes/imageRoutes');
const shareRoutes = require('./routes/shareRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------
// FIXED: PRODUCTION-SAFE CORS + PRE-FLIGHT HANDLING
// -----------------------------------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,         // Your deployed Static Web App
  "http://localhost:5173",          // Local dev frontend
  "http://localhost:3000"           // Optional local backend
];

// Global CORS handler
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // HANDLE PRE-FLIGHT OPTIONS IMMEDIATELY (fixes 405 errors)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// -----------------------------------------------------
// Body Parsers
// -----------------------------------------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -----------------------------------------------------
// Sessions (needed for Passport OAuth)
// -----------------------------------------------------
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // must be HTTPS in prod
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// -----------------------------------------------------
// Passport Initialization (OAuth & JWT)
// -----------------------------------------------------
app.use(passport.initialize());
app.use(passport.session());

// -----------------------------------------------------
// Health check route
// -----------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Photo Editor API is running',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------
// API Routes
// -----------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/shares', shareRoutes);

// -----------------------------------------------------
// Error Handling Middleware
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files' });
    }
    return res.status(400).json({ error: err.message });
  }

  // JWT Unauthorized
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Generic
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// -----------------------------------------------------
// 404 Handler
// -----------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// -----------------------------------------------------
// Start Server
// -----------------------------------------------------
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Photo Editor Backend Server Started  ║
╠════════════════════════════════════════╣
║  Port:        ${PORT.toString().padEnd(26)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}║
║  Time:        ${new Date().toLocaleTimeString().padEnd(26)}║
╚════════════════════════════════════════╝
  `);
  console.log('API Endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/google');
  console.log('  POST /api/photos/upload');
  console.log('  GET  /api/photos');
  console.log('  POST /api/albums');
  console.log('  GET  /api/albums');
  console.log('  POST /api/images/:photoId/edit');
  console.log('  POST /api/shares/albums/:albumId');
  console.log('  GET  /api/shares/:token');
  console.log('');
});

// -----------------------------------------------------
// Unhandled Promise Rejection Handling
// -----------------------------------------------------
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

// -----------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: shutting down server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
