const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const File = require('../models/File');

// Require AWS credentials from env
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET) {
  console.warn('AWS S3 not fully configured in env. File uploads will fail unless configured.');
}

aws.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION || 'us-east-1'
});

const s3 = new aws.S3();

// multer-s3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_BUCKET,
    acl: 'private',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const pid = req.body.patientId || 'unknown';
      const ts = Date.now();
      const key = `${pid}/${ts}-${file.originalname.replace(/\s+/g,'_')}`;
      cb(null, key);
    }
  })
});

// Single file upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // prepare response
    const fileInfo = {
      url: req.file.location || null,
      key: req.file.key || req.file.key,
      filename: req.file.originalname,
      type: req.body.type || req.file.mimetype,
      patientId: req.body.patientId || 'unknown'
    };

    // store metadata if mongoose is connected
    try {
      if (File) {
        await File.create({
          patientId: fileInfo.patientId,
          url: fileInfo.url,
          key: fileInfo.key,
          type: fileInfo.type,
          filename: fileInfo.filename
        });
      }
    } catch (e) {
      console.warn('Could not save file metadata to DB', e.message);
    }

    res.json({ success: true, file: fileInfo });
  } catch (error) {
    console.error('Upload error', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
