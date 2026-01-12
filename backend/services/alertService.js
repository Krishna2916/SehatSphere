const MoodEntry = require('../models/MoodEntry');
const BehaviourLog = require('../models/BehaviourLog');
const WeeklySurvey = require('../models/WeeklySurvey');
const AlertState = require('../models/AlertState');
const AlertHistory = require('../models/AlertHistory');

// Evaluate alert state for a user based on recent signals
async function evaluateAlert(userId) {
  if (!userId) throw new Error('userId is required for alert evaluation');

  const now = new Date();
  const moodWindowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const behaviourWindowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [moods, behaviours, latestSurvey, existingState] = await Promise.all([
    MoodEntry.find({ userId, date: { $gte: moodWindowStart } }).lean(),
    BehaviourLog.find({ userId, date: { $gte: behaviourWindowStart } }).lean(),
    WeeklySurvey.findOne({ userId }).sort({ weekStartDate: -1 }).lean(),
    AlertState.findOne({ userId })
  ]);

  // Count distinct days with low mood (<=2)
  const lowMoodDays = new Set(
    moods
      .filter(m => m.moodScore <= 2)
      .map(m => new Date(m.date).toISOString().slice(0, 10))
  );

  // Count missed check-ins in window
  const missedCheckins = behaviours.filter(b => b.type === 'missed_checkin').length;

  let state = 'stable';
  const triggers = [];

  if (lowMoodDays.size >= 3) {
    state = 'action';
    triggers.push('mood_low_3_days');
  } else if (lowMoodDays.size >= 2) {
    state = 'watch';
    triggers.push('mood_low_2_days');
  }

  if (missedCheckins >= 2) {
    if (state === 'stable') state = 'watch';
    triggers.push('missed_checkins');
  }

  // Weekly survey escalation (only escalate, never downgrade)
  if (latestSurvey && typeof latestSurvey.totalScore === 'number') {
    if (latestSurvey.totalScore <= 4) {
      state = 'action';
      triggers.push('low_weekly_survey');
    } else if (latestSurvey.totalScore <= 6 && state === 'stable') {
      state = 'watch';
      triggers.push('moderate_weekly_survey');
    }
  }

  // Escalate if watch persists > 10 days
  if (existingState && existingState.currentState === 'watch') {
    const daysOnWatch = (now.getTime() - new Date(existingState.sinceDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOnWatch > 10) {
      state = 'action';
      triggers.push('prolonged_watch');
    }
  }

  const explanationParts = [];
  if (lowMoodDays.size) explanationParts.push(`You’ve had ${lowMoodDays.size} lower-energy day(s) recently.`);
  if (missedCheckins) explanationParts.push(`We noticed ${missedCheckins} day(s) without a check-in.`);
  if (latestSurvey) explanationParts.push(`Your recent weekly check-in total is ${latestSurvey.totalScore}.`);
  if (!explanationParts.length) explanationParts.push('All clear today. We’ll keep gently tracking for you.');
  const explanation = explanationParts.join(' ');

  const stateChanged = !existingState || existingState.currentState !== state;
  const alertState = await AlertState.findOneAndUpdate(
    { userId },
    {
      currentState: state,
      triggeredBy: triggers,
      explanation,
      lastEvaluated: now,
      ...(stateChanged ? { sinceDate: now } : {})
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (stateChanged && existingState) {
    await AlertHistory.create({
      userId,
      fromState: existingState.currentState,
      toState: state,
      triggeredBy: triggers,
      explanation,
      changedAt: now
    });
  }

  if (stateChanged && !existingState) {
    await AlertHistory.create({
      userId,
      fromState: 'stable',
      toState: state,
      triggeredBy: triggers,
      explanation,
      changedAt: now
    });
  }

  return alertState.currentState;
}

module.exports = { evaluateAlert };
