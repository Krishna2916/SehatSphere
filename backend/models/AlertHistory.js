const mongoose = require('mongoose');

const alertHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromState: {
    type: String,
    enum: ['stable', 'watch', 'action'],
    required: true
  },
  toState: {
    type: String,
    enum: ['stable', 'watch', 'action'],
    required: true
  },
  triggeredBy: {
    type: [String],
    default: []
  },
  explanation: {
    type: String,
    trim: true
  },
  changedAt: {
    type: Date,
    default: () => new Date()
  }
}, { timestamps: true });

alertHistorySchema.index({ userId: 1, changedAt: -1 });

const AlertHistory = mongoose.model('AlertHistory', alertHistorySchema);

module.exports = AlertHistory;
