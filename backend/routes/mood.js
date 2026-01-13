const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');
const { evaluateAlert } = require('../services/alertService');

// POST /api/mood
// Body: { userId, moodScore (1-5), note? }
router.post('/', async (req, res) => {
  try {
    const { userId, moodScore, note } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const scoreNum = Number(moodScore);
    if (!Number.isFinite(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return res.status(400).json({ success: false, error: 'moodScore must be between 1 and 5' });
    }

    // Resolve userId: accept ObjectId or healthId fallback
    let resolvedUserId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ healthId: userId }).select('_id');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found for provided identifier' });
      }
      resolvedUserId = user._id;
    }

    const entry = new MoodEntry({
      userId: resolvedUserId,
      moodScore: scoreNum,
      note
    });

    await entry.save();

    // Trigger alert evaluation asynchronously (fire-and-forget)
    evaluateAlert(entry.userId).catch(err => {
      console.error('Alert evaluation failed:', err.message);
    });

    return res.status(201).json({ success: true, entry });
  } catch (err) {
    console.error('Error creating mood entry:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to save mood entry' });
  }
});

module.exports = router;
