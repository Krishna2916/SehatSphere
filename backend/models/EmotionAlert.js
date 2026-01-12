const mongoose = require('mongoose');

const emotionAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  state: { type: String, enum: ['stable', 'watch', 'action'], default: 'watch' },
  reason: { type: String, required: true },
  triggeredAt: { type: Date, default: Date.now },
  lastEvaluated: { type: Date, default: Date.now },
  lastNotificationStatus: { type: String, enum: ['not_sent', 'sent', 'failed'], default: 'not_sent' },
  lastNotificationAt: { type: Date },
  lastNotificationError: { type: String }
});

emotionAlertSchema.index({ userId: 1, triggeredAt: -1 });

module.exports = mongoose.model('EmotionAlert', emotionAlertSchema);
