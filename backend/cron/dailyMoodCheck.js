const cron = require('node-cron');
const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const BehaviourLog = require('../models/BehaviourLog');
const { evaluateAlert } = require('../services/alertService');

// Schedule daily job at 22:00 server time
function setupDailyMoodCheck() {
  cron.schedule('0 22 * * *', async () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    try {
      const users = await User.find({}, { _id: 1 }).lean();
      for (const user of users) {
        try {
          const hasMoodToday = await MoodEntry.exists({
            userId: user._id,
            date: { $gte: start, $lte: end }
          });

          if (!hasMoodToday) {
            await BehaviourLog.create({
              userId: user._id,
              type: 'missed_checkin',
              date: now
            });
          }

          await evaluateAlert(user._id);
        } catch (innerErr) {
          console.error(`Daily mood check failed for user ${user._id}:`, innerErr.message);
        }
      }
    } catch (err) {
      console.error('Daily mood check job failed:', err.message);
    }
  });
}

module.exports = { setupDailyMoodCheck };
