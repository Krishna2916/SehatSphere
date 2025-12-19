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
const isProd = process.env.NODE_ENV === 'production';
const resolveMongoUri = () => {
  // Prefer MONGODB_URI, otherwise allow MONGO_URI for hosting platforms that use it
  const raw = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
  const fallback = 'mongodb://localhost:27017/sehatsphere';

  if (!raw) {
    if (isProd) {
      throw new Error('MONGODB_URI is required in production. Set it to your Mongo connection string.');
    }
    console.warn('⚠️  MONGODB_URI not set. Using local fallback mongodb://localhost:27017/sehatsphere');
    return fallback;
  }

  const ok = raw.startsWith('mongodb://') || raw.startsWith('mongodb+srv://');
  if (!ok) {
    if (isProd) {
      throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }
    console.warn('⚠️  Invalid MONGODB_URI scheme; expected mongodb:// or mongodb+srv://. Using local fallback.');
    return fallback;
  }

  return raw;
};

let MONGODB_URI;
try {
  MONGODB_URI = resolveMongoUri();
  const masked = MONGODB_URI.replace(/:[^:@/]+@/, ':****@');
  console.log(`Connecting to MongoDB -> ${masked}`);
} catch (err) {
  console.error(`❌ MongoDB configuration error: ${err.message}`);
  process.exit(1);
}

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    if (isProd) {
      console.error('Stopping server because database is required in production.');
      process.exit(1);
    }
    console.log('⚠️  Continuing without database (development mode only). Some features will be limited.');
  });

// Routes
const authRouter = require('./routes/auth');
const filesRouter = require('./routes/files');
const aiRouter = require('./routes/ai');
const uploadRouter = require('./routes/upload');
const path = require('path');
const fs = require('fs');

// Root health-check (plain text)
app.get('/', (req, res) => {
  res.status(200).send('SehatSphere backend is live');
});

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
