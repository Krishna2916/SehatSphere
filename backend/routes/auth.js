const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const {
  generateToken,
  verifyToken,
  validatePin,
  logAuditEvent,
  getClientInfo
} = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user with email/phone and set PIN
 * 
 * Body:
 * - email (optional): user's email
 * - phone (optional): user's phone number
 * - name (required): user's full name
 * - pin (required): 4 or 6 digit PIN
 * - role (optional): user role (default: 'patient')
 * 
 * Note: At least one of email or phone must be provided
 */
router.post('/register', async (req, res) => {
  try {
    const { email, phone, name, pin, role } = req.body;
    const clientInfo = getClientInfo(req);
    
    // Validation
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Either email or phone is required'
      });
    }
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Valid name is required'
      });
    }
    
    if (!validatePin(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 or 6 digits'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmailOrPhone(email || phone);
    if (existingUser) {
      await logAuditEvent({
        action: 'REGISTER',
        identifier: email || phone,
        ...clientInfo,
        success: false,
        failureReason: 'User already exists'
      });
      
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email or phone'
      });
    }
    
    // Generate unique Health ID
    const genHealthId = (name) => {
      const base = (name || 'user').replace(/\s+/g, '').toUpperCase().slice(0, 6);
      const rand = Math.floor(Math.random() * 90000) + 10000;
      return 'MED' + base + rand.toString().slice(0, 5);
    };
    
    // Create new user
    const user = new User({
      email: email ? email.toLowerCase().trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      name: name.trim(),
      role: role || 'patient',
      healthId: genHealthId(name),
      pinHash: pin, // Will be hashed by pre-save hook
      pinSet: true
    });
    
    await user.save();
    
    // Log successful registration
    await logAuditEvent({
      userId: user._id,
      action: 'REGISTER',
      identifier: email || phone,
      ...clientInfo,
      success: true
    });
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        healthId: user.healthId,
        pinSet: user.pinSet
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Return more specific error messages
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const messages = Object.values(error.errors).map(e => e.message);
      errorMessage = messages.join('. ');
    } else if (error.code === 11000) {
      // Duplicate key error
      errorMessage = 'User already exists with this email or phone';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email/phone + PIN
 * 
 * Body:
 * - identifier (required): email or phone
 * - pin (required): 4 or 6 digit PIN
 * 
 * Returns JWT token on success
 * Implements rate limiting: max 3 failed attempts, then 10 min lockout
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, pin } = req.body;
    const clientInfo = getClientInfo(req);
    
    // Validation
    if (!identifier || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Email/phone and PIN are required'
      });
    }
    
    if (!validatePin(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 or 6 digits'
      });
    }
    
    // Find user
    const user = await User.findByEmailOrPhone(identifier);
    
    if (!user) {
      // Log failed attempt (no userId since user not found)
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        identifier,
        ...clientInfo,
        success: false,
        failureReason: 'User not found'
      });
      
      // Generic error message to prevent user enumeration
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if account is locked
    if (user.isAccountLocked()) {
      const lockTime = Math.ceil((user.accountLockedUntil - Date.now()) / 60000);
      
      await logAuditEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        identifier,
        ...clientInfo,
        success: false,
        failureReason: 'Account locked'
      });
      
      return res.status(423).json({
        success: false,
        error: `Account is locked. Try again in ${lockTime} minute(s).`,
        lockedUntil: user.accountLockedUntil
      });
    }
    
    // Verify PIN
    const isPinValid = await user.comparePin(pin);
    
    if (!isPinValid) {
      // Increment failed attempts
      await user.incrementFailedAttempts();
      
      const remainingAttempts = Math.max(0, 3 - user.failedLoginAttempts);
      
      await logAuditEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        identifier,
        ...clientInfo,
        success: false,
        failureReason: 'Invalid PIN',
        metadata: {
          failedAttempts: user.failedLoginAttempts,
          remainingAttempts
        }
      });
      
      if (user.failedLoginAttempts >= 3) {
        await logAuditEvent({
          userId: user._id,
          action: 'ACCOUNT_LOCKED',
          identifier,
          ...clientInfo,
          success: true,
          metadata: {
            lockedUntil: user.accountLockedUntil
          }
        });
        
        return res.status(423).json({
          success: false,
          error: 'Account locked due to multiple failed attempts. Try again in 10 minutes.',
          lockedUntil: user.accountLockedUntil
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        remainingAttempts
      });
    }
    
    // Successful login - reset failed attempts
    await user.resetFailedAttempts();
    
    await logAuditEvent({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      identifier,
      ...clientInfo,
      success: true
    });
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        healthId: user.healthId,
        pinSet: user.pinSet,
        // OTP flag for future use
        otpEnabled: user.otpEnabled
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return user data
 * 
 * Headers:
 * - Authorization: Bearer <token>
 */
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-pinHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        healthId: user.healthId,
        pinSet: user.pinSet,
        otpEnabled: user.otpEnabled
      }
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

/**
 * POST /api/auth/change-pin
 * Change user's PIN (requires authentication)
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Body:
 * - oldPin (required): current PIN
 * - newPin (required): new 4 or 6 digit PIN
 */
router.post('/change-pin', verifyToken, async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const clientInfo = getClientInfo(req);
    
    if (!oldPin || !newPin) {
      return res.status(400).json({
        success: false,
        error: 'Both old and new PIN are required'
      });
    }
    
    if (!validatePin(newPin)) {
      return res.status(400).json({
        success: false,
        error: 'New PIN must be 4 or 6 digits'
      });
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Verify old PIN
    const isOldPinValid = await user.comparePin(oldPin);
    
    if (!isOldPinValid) {
      await logAuditEvent({
        userId: user._id,
        action: 'PIN_CHANGE',
        identifier: user.email || user.phone,
        ...clientInfo,
        success: false,
        failureReason: 'Invalid old PIN'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Current PIN is incorrect'
      });
    }
    
    // Update PIN
    user.pinHash = newPin; // Will be hashed by pre-save hook
    await user.save();
    
    await logAuditEvent({
      userId: user._id,
      action: 'PIN_CHANGE',
      identifier: user.email || user.phone,
      ...clientInfo,
      success: true
    });
    
    res.json({
      success: true,
      message: 'PIN changed successfully'
    });
    
  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({
      success: false,
      error: 'PIN change failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/request-otp
 * Request OTP for authentication (FUTURE IMPLEMENTATION)
 * 
 * Body:
 * - identifier: email or phone
 * - method: 'email' or 'sms'
 * 
 * This endpoint is a placeholder for OTP functionality to be added at launch.
 * Currently returns a message indicating OTP is not yet enabled.
 */
router.post('/request-otp', async (req, res) => {
  try {
    const { identifier, method } = req.body;
    const clientInfo = getClientInfo(req);
    
    // TODO: Implement OTP generation and delivery at launch
    // For now, return placeholder response
    
    await logAuditEvent({
      action: 'OTP_SENT',
      identifier,
      ...clientInfo,
      success: false,
      failureReason: 'OTP not yet enabled',
      metadata: { method }
    });
    
    res.status(501).json({
      success: false,
      error: 'OTP authentication will be available at launch',
      message: 'Please use PIN-based authentication for now'
    });
    
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP request failed'
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code (FUTURE IMPLEMENTATION)
 * 
 * Body:
 * - identifier: email or phone
 * - otp: OTP code
 * 
 * This endpoint is a placeholder for OTP functionality to be added at launch.
 * The OTP verification logic can be plugged in here without refactoring the rest of the system.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const clientInfo = getClientInfo(req);
    
    // TODO: Implement OTP verification at launch
    // Steps to add later:
    // 1. Find user by identifier
    // 2. Retrieve stored OTP from cache/database
    // 3. Verify OTP matches and is not expired
    // 4. Generate and return JWT token on success
    // 5. Log audit event
    
    await logAuditEvent({
      action: 'OTP_VERIFIED',
      identifier,
      ...clientInfo,
      success: false,
      failureReason: 'OTP not yet enabled'
    });
    
    res.status(501).json({
      success: false,
      error: 'OTP verification will be available at launch',
      message: 'Please use PIN-based authentication for now'
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed'
    });
  }
});

module.exports = router;
