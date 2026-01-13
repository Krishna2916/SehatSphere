const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AlertState = require('../models/AlertState');
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');
const EmotionAlert = require('../models/EmotionAlert');

// GET /api/alert/:userId
// Returns alert state and last 7 days of mood entries
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    // Resolve user: accept ObjectId or healthId
    let resolvedUserId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      resolvedUserId = new mongoose.Types.ObjectId(userId);
    } else {
      const user = await User.findOne({ healthId: userId }).select('_id');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found for provided identifier' });
      }
      resolvedUserId = user._id;
    }

    const now = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [state, moods, emotionAlert] = await Promise.all([
      AlertState.findOne({ userId: resolvedUserId }).lean(),
      MoodEntry.find({ userId: resolvedUserId, date: { $gte: start } })
        .sort({ date: 1 })
        .select({ moodScore: 1, date: 1, _id: 0 })
        .lean(),
      EmotionAlert.findOne({ userId: resolvedUserId }).lean()
    ]);

    return res.json({
      success: true,
      state: state || {
        currentState: 'stable',
        explanation: 'All looks steady. We’ll keep an eye on things for you.',
        triggeredBy: [],
        sinceDate: null,
        lastEvaluated: null
      },
      moods,
      emotionAlert: emotionAlert || null
    });
  } catch (err) {
    console.error('Error fetching alert state:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch alert state' });
  }
});

module.exports = router;
