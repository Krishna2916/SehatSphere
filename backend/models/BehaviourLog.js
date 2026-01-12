const mongoose = require('mongoose');

const behaviourLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['missed_checkin', 'missed_med', 'inactivity']
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date()
  }
}, { timestamps: true });

behaviourLogSchema.index({ userId: 1, date: -1 });

const BehaviourLog = mongoose.model('BehaviourLog', behaviourLogSchema);

module.exports = BehaviourLog;
