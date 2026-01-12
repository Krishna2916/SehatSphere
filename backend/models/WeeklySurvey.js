const mongoose = require('mongoose');

const weeklySurveySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sleep: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  stress: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  energy: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  focus: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  social: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  weekStartDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Optional: speed lookups by user/week
weeklySurveySchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

const WeeklySurvey = mongoose.model('WeeklySurvey', weeklySurveySchema);

module.exports = WeeklySurvey;
