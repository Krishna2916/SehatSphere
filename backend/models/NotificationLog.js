const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['EMERGENCY_SMS'], required: true },
  phone: { type: String },
  status: { type: String, enum: ['SENT', 'FAILED'], required: true },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

notificationLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
