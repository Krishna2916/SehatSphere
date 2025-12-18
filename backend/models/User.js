const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness for non-null
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness for non-null
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'hospital', 'oldage', 'pathology', 'dementia'],
    default: 'patient'
  },
  pinHash: {
    type: String,
    required: false // Will be set after first login or during signup
  },
  pinSet: {
    type: Boolean,
    default: false
  },
  healthId: {
    type: String,
    unique: true
  },
  // OTP-related fields (for future implementation)
  otpEnabled: {
    type: Boolean,
    default: false // Will be enabled at launch
  },
  otpSecret: {
    type: String,
    required: false // For TOTP if needed later
  },
  // Account security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure at least email or phone is provided
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone must be provided'));
  } else {
    next();
  }
});

// Hash PIN before saving
userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // If PIN is being modified and it's not already hashed
  if (this.isModified('pinHash') && this.pinHash && !this.pinHash.startsWith('$2a$')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.pinHash = await bcrypt.hash(this.pinHash, salt);
      this.pinSet = true;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to compare PIN
userSchema.methods.comparePin = async function(candidatePin) {
  if (!this.pinHash) return false;
  return await bcrypt.compare(candidatePin, this.pinHash);
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = async function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 3 failed attempts for 10 minutes
  if (this.failedLoginAttempts >= 3) {
    this.accountLockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }
  
  await this.save();
};

// Method to reset failed attempts on successful login
userSchema.methods.resetFailedAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  this.lastLoginAt = new Date();
  await this.save();
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = function(emailOrPhone) {
  const isEmail = emailOrPhone.includes('@');
  return this.findOne(isEmail ? { email: emailOrPhone } : { phone: emailOrPhone });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
