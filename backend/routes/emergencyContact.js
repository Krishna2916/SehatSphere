const express = require('express');
const mongoose = require('mongoose');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');

const router = express.Router();

// Resolve userId: accept ObjectId or healthId
async function resolveUserId(id) {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  const user = await User.findOne({ healthId: id }).select('_id');
  return user ? user._id : null;
}

// POST /api/emergency-contact
// Body: { userId, name, phone, relationship }
router.post('/', async (req, res) => {
  try {
    const { userId, name, phone, relationship } = req.body;
    if (!userId || !name || !phone) {
      return res.status(400).json({ success: false, error: 'userId, name, and phone are required' });
    }

    const resolvedUserId = await resolveUserId(userId);
    if (!resolvedUserId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      { userId: resolvedUserId },
      { userId: resolvedUserId, name, phone, relationship },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(201).json({ success: true, contact });
  } catch (err) {
    console.error('Error saving emergency contact:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to save emergency contact' });
  }
});

// GET /api/emergency-contact/:userId
router.get('/:userId', async (req, res) => {
  try {
    const resolvedUserId = await resolveUserId(req.params.userId);
    if (!resolvedUserId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const contact = await EmergencyContact.findOne({ userId: resolvedUserId }).lean();
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Emergency contact not set' });
    }
    return res.json({ success: true, contact });
  } catch (err) {
    console.error('Error fetching emergency contact:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch emergency contact' });
  }
});

module.exports = router;
