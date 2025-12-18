const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'sehatsphere-mvp-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30m'; // 30 minutes

/**
 * Generate JWT token for authenticated user
 */
function generateToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    healthId: user.healthId
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token middleware
 * Attach user data to req.user if valid
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

/**
 * Optional authentication middleware
 * Does not reject request if no token, but attaches user if valid token exists
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
}

/**
 * Validate PIN format
 * Must be 4 or 6 digits
 */
function validatePin(pin) {
  if (!pin) return false;
  
  const pinStr = String(pin);
  return /^\d{4}$|^\d{6}$/.test(pinStr);
}

/**
 * Log authentication events to audit log
 */
async function logAuditEvent(eventData) {
  try {
    const auditLog = new AuditLog(eventData);
    await auditLog.save();
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error - audit logging failure shouldn't break auth flow
  }
}

/**
 * Extract client info from request
 */
function getClientInfo(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };
}

module.exports = {
  generateToken,
  verifyToken,
  optionalAuth,
  validatePin,
  logAuditEvent,
  getClientInfo,
  JWT_SECRET,
  JWT_EXPIRY
};
