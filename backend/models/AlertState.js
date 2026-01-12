const mongoose = require('mongoose');

const alertStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentState: {
    type: String,
    enum: ['stable', 'watch', 'action'],
    required: true,
    default: 'stable'
  },
  triggeredBy: {
    type: [String],
    default: []
  },
  sinceDate: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  explanation: {
    type: String,
    trim: true
  },
  lastEvaluated: {
    type: Date,
    required: true,
    default: () => new Date()
  }
}, { timestamps: true });

// Ensure only one AlertState per user
alertStateSchema.index({ userId: 1 }, { unique: true });

const AlertState = mongoose.model('AlertState', alertStateSchema);

module.exports = AlertState;
