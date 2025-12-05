require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup for file uploads
const allowedExt = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-()_ ]/g, '_');
    cb(null, `${ts}-${safeName}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error('Only PDF/DOC/DOCX and image files allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const filePath = `/uploads/${fileName}`;
    res.json({ success: true, fileName, originalName, path: filePath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SehatSphere backend running on port ${PORT}`));
