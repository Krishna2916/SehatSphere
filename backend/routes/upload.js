const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads directory (relative to backend/)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Accept only PDF, DOC, DOCX
const allowedExt = ['.pdf', '.doc', '.docx'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-()_ ]/g, '_');
    cb(null, `${ts}-${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error('Only PDF, DOC and DOCX files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

// Single file upload at POST /
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    // Return a path relative to server root where files are served
    const filePath = `/uploads/${fileName}`;

    return res.json({ success: true, fileName, originalName, path: filePath });
  } catch (err) {
    console.error('Local upload error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
