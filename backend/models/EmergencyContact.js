const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true }, // Expect E.164 with country code
  relationship: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

emergencyContactSchema.index({ userId: 1 });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
