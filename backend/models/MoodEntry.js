const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  note: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date()
  }
}, { timestamps: true });

// Compound index to speed lookups by user and day
moodEntrySchema.index({ userId: 1, date: 1 });

const MoodEntry = mongoose.model('MoodEntry', moodEntrySchema);

module.exports = MoodEntry;
