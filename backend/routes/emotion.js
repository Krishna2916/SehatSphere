const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Emotion = require('../models/Emotion');
const User = require('../models/User');
const { evaluateEmotionAlert } = require('../services/emotionAlertService');

// TESTING: Joi validation (temporary - can remove if not working)
const { emotionSchema, validate } = require('../utils/validation');

// Controller: compute moodScore from sadness + fear (0-200) -> 1-5
// Mood scale:
// 1 = Very sad/worst mood (high sadness+fear)
// 2 = Sad
// 3 = Neutral but a bit sad or fearful
// 4 = Neutral but more happy side, less fear/sadness
// 5 = Good mood (low sadness+fear)
function computeMoodScore(sadness = 0, fear = 0) {
  const total = (Number(sadness) || 0) + (Number(fear) || 0);
  // Based on normalized 0-100 values for each emotion
  if (total >= 70) return 1;     // Very sad/worst mood
  if (total >= 50) return 2;     // Sad
  if (total >= 30) return 3;     // Neutral but concerned
  if (total >= 15) return 4;     // Neutral but positive
  return 5;                      // Good mood
}

// Normalize userId: accept ObjectId or healthId
async function resolveUserId(userId) {
  if (!userId || typeof userId !== 'string') return null;
  if (mongoose.Types.ObjectId.isValid(userId)) return new mongoose.Types.ObjectId(userId);
  const user = await User.findOne({ healthId: userId }).select('_id');
  return user ? user._id : null;
}

// POST /api/emotion
// Body: { userId, emotions: { sadness, anger, fear, engagement } } OR
//       { userId, emotions: [array], intensity, notes, source: 'manual-survey' }
router.post('/', async (req, res) => {
  try {
    // TESTING: Validate with Joi (temporary)
    const validation = validate(emotionSchema, req.body);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      return res.status(400).json({ 
        success: false, 
        error: validation.errors[0],
        allErrors: validation.errors 
      });
    }
    console.log('✓ Validation passed with Joi');

    const { userId, emotions, intensity, notes, source } = validation.value;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
    if (!emotions) {
      return res.status(400).json({ success: false, error: 'emotions payload is required' });
    }

    const resolvedUserId = await resolveUserId(userId);
    if (!resolvedUserId) {
      return res.status(404).json({ success: false, error: 'User not found for provided identifier' });
    }

    // Handle manual survey format (array of emotion names)
    if (Array.isArray(emotions)) {
      // Map emotion names to numeric values for storage
      // Each emotion maps to sadness/anger/fear/happy with values
      const emotionMap = {
        'Happy': { sadness: 0, anger: 0, fear: 0, happy: 100 },
        'Sad': { sadness: 85, anger: 5, fear: 10, happy: 0 },
        'Anxious': { sadness: 20, anger: 10, fear: 70, happy: 0 },
        'Angry': { sadness: 5, anger: 85, fear: 10, happy: 0 },
        'Calm': { sadness: 0, anger: 0, fear: 0, happy: 100 },
        'Stressed': { sadness: 25, anger: 35, fear: 40, happy: 0 },
        'Excited': { sadness: 0, anger: 0, fear: 5, happy: 95 },
        'Tired': { sadness: 60, anger: 5, fear: 10, happy: 25 }
      };

      // Average values across all selected emotions
      let totalSadness = 0, totalAnger = 0, totalFear = 0, totalHappy = 0;
      emotions.forEach(emotionName => {
        const mapped = emotionMap[emotionName] || { sadness: 25, anger: 25, fear: 25, happy: 25 };
        totalSadness += mapped.sadness;
        totalAnger += mapped.anger;
        totalFear += mapped.fear;
        totalHappy += mapped.happy;
      });

      const count = emotions.length || 1;
      let avgSadness = totalSadness / count;
      let avgAnger = totalAnger / count;
      let avgFear = totalFear / count;
      let avgHappy = totalHappy / count;

      // Normalize so sum = 100
      const sum = avgSadness + avgAnger + avgFear + avgHappy;
      if (sum > 0) {
        avgSadness = (avgSadness / sum) * 100;
        avgAnger = (avgAnger / sum) * 100;
        avgFear = (avgFear / sum) * 100;
        avgHappy = (avgHappy / sum) * 100;
      }

      // Apply intensity scaling (1-10 scale)
      // Higher intensity amplifies the dominant emotions
      const intensityValue = intensity || 5;
      const scaleFactor = (intensityValue / 5); // 1=0.2, 5=1.0, 10=2.0
      
      // Scale and ensure they still sum to 100
      let sadness = avgSadness * scaleFactor;
      let anger = avgAnger * scaleFactor;
      let fear = avgFear * scaleFactor;
      let happy = avgHappy * scaleFactor;
      
      // Re-normalize to sum to 100 after intensity scaling
      const scaledSum = sadness + anger + fear + happy;
      if (scaledSum > 0) {
        sadness = Math.round((sadness / scaledSum) * 100);
        anger = Math.round((anger / scaledSum) * 100);
        fear = Math.round((fear / scaledSum) * 100);
        happy = Math.round((happy / scaledSum) * 100);
      }
      
      const engagement = Math.max(0, Math.min(100, Math.round((happy * 2 + (100 - sadness - fear)) / 3)));

      const moodScore = computeMoodScore(sadness, fear);

      const doc = new Emotion({
        userId: resolvedUserId,
        sadness,
        anger,
        fear,
        happy,
        engagement,
        moodScore,
        source: source || 'manual-survey',
        notes: notes || ''
      });

      await doc.save();

      // Fire-and-forget alert evaluation
      evaluateEmotionAlert(resolvedUserId).catch(err => console.error('Emotion alert eval failed:', err.message));

      return res.status(201).json({ success: true, moodScore, createdAt: doc.createdAt });
    }

    // Handle Affectiva format (numeric object)
    if (typeof emotions !== 'object') {
      return res.status(400).json({ success: false, error: 'emotions payload is required' });
    }

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const sadness = toNum(emotions.sadness);
    const anger = toNum(emotions.anger);
    const fear = toNum(emotions.fear);
    const happy = toNum(emotions.happy) || 0;
    const engagement = toNum(emotions.engagement);

    const fields = { sadness, anger, fear, engagement };
    for (const [k, v] of Object.entries(fields)) {
      if (v === null || v === undefined) {
        return res.status(400).json({ success: false, error: `${k} is required` });
      }
      if (v < 0 || v > 100) {
        return res.status(400).json({ success: false, error: `${k} must be between 0 and 100` });
      }
    }

    const moodScore = computeMoodScore(sadness, fear);

    const doc = new Emotion({
      userId: resolvedUserId,
      sadness,
      anger,
      fear,
      happy,
      engagement,
      moodScore
    });

    await doc.save();

    // Fire-and-forget alert evaluation
    evaluateEmotionAlert(resolvedUserId).catch(err => console.error('Emotion alert eval failed:', err.message));

    return res.status(201).json({ success: true, moodScore, createdAt: doc.createdAt });
  } catch (err) {
    console.error('Error handling emotion sample:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to record emotion sample' });
  }
});

// GET /api/emotion/:userId/analytics
// Returns emotion analytics for the user (last 7 days and last 30 days)
router.get('/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const resolvedUserId = await resolveUserId(userId);
    if (!resolvedUserId) {
      return res.status(404).json({ success: false, error: 'User not found for provided identifier' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all records for last 30 days
    const records = await Emotion.find({
      userId: resolvedUserId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).lean();

    // Group records by day and average them
    const groupByDay = (records) => {
      const dailyGroups = {};
      
      records.forEach(r => {
        const dayKey = new Date(r.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!dailyGroups[dayKey]) {
          dailyGroups[dayKey] = [];
        }
        dailyGroups[dayKey].push(r);
      });

      // Calculate daily averages
      return Object.entries(dailyGroups).map(([dayKey, dayRecords]) => {
        const avgSadness = Math.round(dayRecords.reduce((sum, r) => sum + (r.sadness || 0), 0) / dayRecords.length);
        const avgAnger = Math.round(dayRecords.reduce((sum, r) => sum + (r.anger || 0), 0) / dayRecords.length);
        const avgFear = Math.round(dayRecords.reduce((sum, r) => sum + (r.fear || 0), 0) / dayRecords.length);
        const avgHappy = Math.round(dayRecords.reduce((sum, r) => sum + (r.happy || 0), 0) / dayRecords.length);
        const avgEngagement = Math.round(dayRecords.reduce((sum, r) => sum + (r.engagement || 0), 0) / dayRecords.length);
        const avgMoodScore = Math.round(dayRecords.reduce((sum, r) => sum + (r.moodScore || 0), 0) / dayRecords.length);
        
        // Use the most recent timestamp for display
        const latestRecord = dayRecords.reduce((latest, r) => r.createdAt > latest.createdAt ? r : latest);
        
        // Map individual readings for detailed view
        const individualReadings = dayRecords.map(r => ({
          time: r.createdAt.toISOString(),
          sadness: r.sadness || 0,
          anger: r.anger || 0,
          fear: r.fear || 0,
          happy: r.happy || 0,
          engagement: r.engagement || 0,
          moodScore: r.moodScore || 0,
          notes: r.notes || ''
        })).sort((a, b) => new Date(b.time) - new Date(a.time));
        
        return {
          date: latestRecord.createdAt,
          dayKey,
          sadness: avgSadness,
          anger: avgAnger,
          fear: avgFear,
          happy: avgHappy,
          engagement: avgEngagement,
          moodScore: avgMoodScore,
          source: `${dayRecords.length} check-in${dayRecords.length > 1 ? 's' : ''}`,
          notes: dayRecords.map(r => r.notes).filter(n => n).join('; ') || '',
          readingsCount: dayRecords.length,
          individualReadings
        };
      }).sort((a, b) => b.date - a.date); // Sort by date descending
    };

    const dailyRecords = groupByDay(records);
    const dailyRecords7d = dailyRecords.filter(r => new Date(r.date) >= sevenDaysAgo);

    // Calculate averages from daily averages
    const calcAvg = (arr, field) => {
      if (arr.length === 0) return 0;
      return Math.round(arr.reduce((sum, r) => sum + (r[field] || 0), 0) / arr.length);
    };

    const analytics7d = {
      count: dailyRecords7d.length,
      avgSadness: calcAvg(dailyRecords7d, 'sadness'),
      avgAnger: calcAvg(dailyRecords7d, 'anger'),
      avgFear: calcAvg(dailyRecords7d, 'fear'),
      avgHappy: calcAvg(dailyRecords7d, 'happy'),
      avgEngagement: calcAvg(dailyRecords7d, 'engagement'),
      avgMoodScore: calcAvg(dailyRecords7d, 'moodScore')
    };

    const analytics30d = {
      count: dailyRecords.length,
      avgSadness: calcAvg(dailyRecords, 'sadness'),
      avgAnger: calcAvg(dailyRecords, 'anger'),
      avgFear: calcAvg(dailyRecords, 'fear'),
      avgHappy: calcAvg(dailyRecords, 'happy'),
      avgEngagement: calcAvg(dailyRecords, 'engagement'),
      avgMoodScore: calcAvg(dailyRecords, 'moodScore')
    };

    // Recent entries (daily averages)
    const recentEntries = dailyRecords.slice(0, 10).map(r => ({
      date: r.date.toISOString(),
      sadness: r.sadness,
      anger: r.anger,
      fear: r.fear,
      happy: r.happy,
      engagement: r.engagement,
      moodScore: r.moodScore,
      source: r.source,
      notes: r.notes,
      readingsCount: r.readingsCount,
      individualReadings: r.individualReadings
    }));

    // Group by source
    const bySource = records.reduce((acc, r) => {
      const src = r.source || 'affectiva';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      success: true,
      last7Days: analytics7d,
      last30Days: analytics30d,
      recentEntries,
      bySource
    });
  } catch (err) {
    console.error('Error fetching emotion analytics:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch emotion analytics' });
  }
});

module.exports = router;
