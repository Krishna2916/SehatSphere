const mongoose = require('mongoose');

const emotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sadness: { type: Number, min: 0, max: 100, required: true },
  anger: { type: Number, min: 0, max: 100, required: true },
  fear: { type: Number, min: 0, max: 100, required: true },
  happy: { type: Number, min: 0, max: 100, default: 0 },
  engagement: { type: Number, min: 0, max: 100, required: true },
  moodScore: { type: Number, min: 1, max: 5, required: true },
  source: { type: String, default: 'affectiva' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Optimized for recent-window queries (7/30 days)
emotionSchema.index({ userId: 1, createdAt: -1 });
emotionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Emotion', emotionSchema);
