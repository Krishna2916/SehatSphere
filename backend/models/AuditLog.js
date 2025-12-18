const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // May not have userId if login failed before user identification
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'REGISTER',
      'PIN_CHANGE',
      'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED',
      'OTP_SENT',      // For future OTP implementation
      'OTP_VERIFIED',  // For future OTP implementation
      'OTP_FAILED'     // For future OTP implementation
    ]
  },
  identifier: {
    type: String, // Email or phone used for the action
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  success: {
    type: Boolean,
    required: true
  },
  failureReason: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ identifier: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
