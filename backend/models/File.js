const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  url: { type: String, required: true },
  key: String,
  type: String,
  filename: String,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);
