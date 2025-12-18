const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Configure CORS to allow frontend access
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB (required for authentication)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehatsphere';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Using fallback mode - some features may be limited');
  });

// Routes
const authRouter = require('./routes/auth');
const filesRouter = require('./routes/files');
const aiRouter = require('./routes/ai');
const uploadRouter = require('./routes/upload');
const path = require('path');
const fs = require('fs');

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/ai', aiRouter);
// Serve uploaded files statically from /uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
// Simple local file upload endpoint (used by frontend /api/upload)
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    features: {
      auth: true,
      ai: true,
      fileUpload: true
    }
  });
});

// 404 handler - must return JSON
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handler - must return JSON
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SehatSphere backend running on port ${PORT}`));
