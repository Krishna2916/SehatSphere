const express = require('express');
const PatientRecord = require('../models/PatientRecord');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get the current user's patient record
router.get('/me', verifyToken, async (req, res) => {
  try {
    const record = await PatientRecord.findOne({ userId: req.user.userId });
    if (!record) {
      return res.status(404).json({ success: false, error: 'Patient record not found' });
    }
    res.json({ success: true, ...record.data });
  } catch (err) {
    console.error('GET /patient/me error', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Seed/create a patient record
router.post('/', verifyToken, async (req, res) => {
  try {
    const payload = req.body || {};
    const existing = await PatientRecord.findOne({ userId: req.user.userId });
    if (existing) {
      existing.data = payload;
      await existing.save();
      return res.json({ success: true, ...existing.data });
    }
    const record = new PatientRecord({ userId: req.user.userId, data: payload });
    await record.save();
    res.json({ success: true, ...record.data });
  } catch (err) {
    console.error('POST /patient error', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update existing patient record
router.put('/', verifyToken, async (req, res) => {
  try {
    const payload = req.body || {};
    const record = await PatientRecord.findOneAndUpdate(
      { userId: req.user.userId },
      { data: payload, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, ...record.data });
  } catch (err) {
    console.error('PUT /patient error', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
