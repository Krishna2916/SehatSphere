const Emotion = require('../models/Emotion');
const EmotionAlert = require('../models/EmotionAlert');
const { sendEmergencySMS } = require('./notificationService');

// Helper: evaluate alert rules for a user
async function evaluateEmotionAlert(userId) {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Fetch recent emotions (last ~72h) to keep data small
  const recent = await Emotion.find({ userId, createdAt: { $gte: since24h } })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!recent.length) {
    return await persistState(userId, 'stable', 'No recent emotion data');
  }

  // Rule 1: sadness > 0.7 for 3 consecutive logs
  let sadnessTrigger = false;
  for (let i = 0; i <= recent.length - 3; i += 1) {
    if (recent[i].sadness > 0.7 && recent[i + 1].sadness > 0.7 && recent[i + 2].sadness > 0.7) {
      sadnessTrigger = true;
      break;
    }
  }

  // Rule 2: moodScore <= 2 for more than 24h
  const lowMoods = recent.filter(r => r.moodScore <= 2);
  const lowMoodTrigger = lowMoods.length > 0 && lowMoods[0].createdAt <= since24h;

  if (sadnessTrigger || lowMoodTrigger) {
    const reason = sadnessTrigger ? 'High sadness sustained' : 'Mood very low >24h';
    const alert = await persistState(userId, 'action', reason);
    triggerNotification(userId, alert, reason).catch(err => console.error('Notify error:', err.message));
    return alert;
  }

  return await persistState(userId, 'stable', 'Emotions within normal range');
}

async function persistState(userId, state, reason) {
  const doc = await EmotionAlert.findOneAndUpdate(
    { userId },
    {
      state,
      reason,
      lastEvaluated: new Date(),
      triggeredAt: state === 'action' ? new Date() : undefined,
      ...(state !== 'action' ? { lastNotificationStatus: 'not_sent' } : {})
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

async function triggerNotification(userId, alertDoc, reason) {
  // Avoid repeat sends if already sent in last 30 minutes
  if (alertDoc.lastNotificationAt && (Date.now() - alertDoc.lastNotificationAt.getTime()) < 30 * 60 * 1000) {
    return;
  }

  const res = await sendEmergencySMS({ userId });
  alertDoc.lastNotificationAt = new Date();
  if (res.ok) {
    alertDoc.lastNotificationStatus = 'sent';
    alertDoc.lastNotificationError = undefined;
  } else {
    alertDoc.lastNotificationStatus = 'failed';
    alertDoc.lastNotificationError = res.error;
  }
  await alertDoc.save();
}

module.exports = {
  evaluateEmotionAlert
};
