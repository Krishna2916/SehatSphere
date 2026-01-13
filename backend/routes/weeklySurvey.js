const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WeeklySurvey = require('../models/WeeklySurvey');
const User = require('../models/User');
const { evaluateAlert } = require('../services/alertService');

// Helper: normalize a date to Monday 00:00:00 UTC for consistent weekly buckets
function startOfWeekUTC(d = new Date()) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // 0=Sun => 6, 1=Mon =>0
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diff));
}

// POST /api/weekly-survey
router.post('/', async (req, res) => {
  try {
    const { userId, sleep, stress, energy, focus, social } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Resolve user: accept ObjectId or healthId
    let userObjectId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      const user = await User.findOne({ healthId: userId }).select('_id');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found for provided identifier' });
      }
      userObjectId = user._id;
    }

    const fields = { sleep, stress, energy, focus, social };
    for (const [key, val] of Object.entries(fields)) {
      const num = Number(val);
      if (!Number.isFinite(num) || num < 0 || num > 2) {
        return res.status(400).json({ success: false, error: `${key} must be between 0 and 2` });
      }
      fields[key] = num;
    }

    const totalScore = fields.sleep + fields.stress + fields.energy + fields.focus + fields.social;

    // Normalize to start-of-week (Monday 00:00 UTC)
    const weekStartDate = req.body.weekStartDate
      ? startOfWeekUTC(new Date(req.body.weekStartDate))
      : startOfWeekUTC(new Date());

    // Upsert: keep only one survey per user per week
    const entry = await WeeklySurvey.findOneAndUpdate(
      { userId: userObjectId, weekStartDate },
      {
        userId: userObjectId,
        ...fields,
        totalScore,
        weekStartDate
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // FIXED: Pass resolved ObjectId instead of original userId string
    const currentState = await evaluateAlert(userObjectId);

    return res.status(201).json({ success: true, currentState });
  } catch (err) {
    console.error('Error saving weekly survey:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save weekly survey' });
  }
});

// GET /api/weekly-survey/:userId/analytics
// Query params: weeks (optional, defaults to 8, max 52)
router.get('/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;
    const weeks = Math.min(Math.max(Number(req.query.weeks) || 8, 1), 52);

    let userObjectId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      const user = await User.findOne({ healthId: userId }).select('_id');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found for provided identifier' });
      }
      userObjectId = user._id;
    }

    // Start window for averages/series (inclusive of oldest week)
    const windowStart = startOfWeekUTC(new Date(Date.now() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000));

    const [latest, series, aggregates] = await Promise.all([
      WeeklySurvey.findOne({ userId: userObjectId })
        .sort({ weekStartDate: -1, createdAt: -1 })
        .lean(),
      // Collapse duplicates per week: take the most recent entry per week, ordered by weekStartDate asc
      WeeklySurvey.aggregate([
        { $match: { userId: userObjectId, weekStartDate: { $gte: windowStart } } },
        { $sort: { weekStartDate: 1, createdAt: -1 } },
        {
          $group: {
            _id: '$weekStartDate',
            sleep: { $first: '$sleep' },
            stress: { $first: '$stress' },
            energy: { $first: '$energy' },
            focus: { $first: '$focus' },
            social: { $first: '$social' },
            totalScore: { $first: '$totalScore' },
            weekStartDate: { $first: '$weekStartDate' }
          }
        },
        { $sort: { weekStartDate: 1 } }
      ]),
      WeeklySurvey.aggregate([
        { $match: { userId: userObjectId, weekStartDate: { $gte: windowStart } } },
        {
          $group: {
            _id: null,
            sleepAvg: { $avg: '$sleep' },
            stressAvg: { $avg: '$stress' },
            energyAvg: { $avg: '$energy' },
            focusAvg: { $avg: '$focus' },
            socialAvg: { $avg: '$social' },
            totalAvg: { $avg: '$totalScore' }
          }
        }
      ])
    ]);

    const averages = aggregates[0]
      ? {
          sleep: aggregates[0].sleepAvg,
          stress: aggregates[0].stressAvg,
          energy: aggregates[0].energyAvg,
          focus: aggregates[0].focusAvg,
          social: aggregates[0].socialAvg,
          total: aggregates[0].totalAvg,
          windowWeeks: weeks
        }
      : null;

    return res.json({ success: true, latest, averages, series });
  } catch (err) {
    console.error('Error fetching weekly survey analytics:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch weekly survey analytics' });
  }
});

module.exports = router;
