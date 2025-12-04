const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB if provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB error', err));
}

// Routes
const filesRouter = require('./routes/files');
const aiRouter = require('./routes/ai');
const uploadRouter = require('./routes/upload');
const path = require('path');
const fs = require('fs');

app.use('/api/files', filesRouter);
app.use('/api/ai', aiRouter);
// Serve uploaded files statically from /uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
// Simple local file upload endpoint (used by frontend /api/upload)
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SehatSphere backend running on port ${PORT}`));
