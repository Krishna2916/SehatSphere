const mongoose = require('mongoose');

const PatientRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PatientRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PatientRecord', PatientRecordSchema);
