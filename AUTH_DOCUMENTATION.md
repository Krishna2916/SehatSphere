# SehatSphere PIN Authentication System

## Overview

SehatSphere uses a **PIN-based authentication system** for the MVP phase. This provides a simple, secure, and user-friendly authentication experience while maintaining the flexibility to add OTP functionality at launch without major refactoring.

## 🔐 Authentication Flow

### Registration (Sign Up)
1. User provides:
   - Email OR Phone (at least one required)
   - Full Name
   - 4 or 6 digit Secure PIN
   - Role (patient, hospital, oldage, pathology, dementia)

2. Backend validates input and creates user account:
   - PIN is hashed using bcrypt (10 salt rounds)
   - Unique Health ID is generated
   - User record is stored in MongoDB

3. JWT token is generated and returned (30 min expiry)

### Login (Sign In)
1. User provides:
   - Email OR Phone
   - 4 or 6 digit Secure PIN

2. Backend validates credentials:
   - Finds user by email/phone
   - Checks if account is locked
   - Verifies PIN against stored hash
   - Tracks failed attempts (max 3)

3. On success:
   - Failed attempt counter is reset
   - JWT token is generated and returned
   - User data is included in response

4. On failure:
   - Failed attempt counter is incremented
   - After 3 failed attempts, account is locked for 10 minutes
   - Audit log is created

## 🔑 Security Features

### PIN Hashing
- All PINs are hashed using bcrypt before storage
- 10 salt rounds for strong protection
- Never stored in plain text
- Frontend never receives PIN hashes

### Rate Limiting
- Maximum 3 failed login attempts
- Account locked for 10 minutes after 3 failures
- Prevents brute force attacks
- Automatic unlock after timeout

### JWT Sessions
- 30-minute token expiry (configurable via JWT_EXPIRY env var)
- Token includes: userId, email, phone, role, healthId
- Required for protected routes
- Auto-refresh on valid token

### Audit Logging
- All authentication events are logged:
  - LOGIN_SUCCESS
  - LOGIN_FAILED
  - REGISTER
  - PIN_CHANGE
  - ACCOUNT_LOCKED
  - OTP_SENT (future)
  - OTP_VERIFIED (future)
- Logs include: timestamp, IP address, user agent
- Helps with security monitoring

## 📡 API Endpoints

### POST /api/auth/register
Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",    // Optional (but email OR phone required)
  "phone": "+91 98765 43210",     // Optional (but email OR phone required)
  "name": "Ravi Kumar",           // Required
  "pin": "1234",                  // Required (4 or 6 digits)
  "role": "patient"               // Optional (default: "patient")
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "phone": "+91 98765 43210",
    "name": "Ravi Kumar",
    "role": "patient",
    "healthId": "MEDRAVIKU12345",
    "pinSet": true
  }
}
```

**Error Response (400/409/500):**
```json
{
  "success": false,
  "error": "User already exists with this email or phone"
}
```

### POST /api/auth/login
Login with email/phone + PIN

**Request Body:**
```json
{
  "identifier": "user@example.com",  // Email or phone
  "pin": "1234"                      // 4 or 6 digit PIN
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "phone": "+91 98765 43210",
    "name": "Ravi Kumar",
    "role": "patient",
    "healthId": "MEDRAVIKU12345",
    "pinSet": true,
    "otpEnabled": false
  }
}
```

**Error Responses:**

Invalid credentials (401):
```json
{
  "success": false,
  "error": "Invalid credentials",
  "remainingAttempts": 2
}
```

Account locked (423):
```json
{
  "success": false,
  "error": "Account locked due to multiple failed attempts. Try again in 10 minutes.",
  "lockedUntil": "2025-12-17T14:30:00.000Z"
}
```

### GET /api/auth/verify
Verify JWT token and get user data

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "phone": "+91 98765 43210",
    "name": "Ravi Kumar",
    "role": "patient",
    "healthId": "MEDRAVIKU12345",
    "pinSet": true,
    "otpEnabled": false
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

### POST /api/auth/change-pin
Change user's PIN (requires authentication)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPin": "1234",
  "newPin": "5678"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "PIN changed successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Current PIN is incorrect"
}
```

### POST /api/auth/request-otp (PLACEHOLDER)
Request OTP for authentication (future implementation)

**Response (501):**
```json
{
  "success": false,
  "error": "OTP authentication will be available at launch",
  "message": "Please use PIN-based authentication for now"
}
```

### POST /api/auth/verify-otp (PLACEHOLDER)
Verify OTP code (future implementation)

**Response (501):**
```json
{
  "success": false,
  "error": "OTP verification will be available at launch",
  "message": "Please use PIN-based authentication for now"
}
```

## 🔄 Frontend Integration

### Login Flow
```javascript
// Login with email/phone + PIN
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    identifier: 'user@example.com',  // or phone
    pin: '1234'
  })
});

const data = await response.json();

if (data.success) {
  // Store JWT token
  localStorage.setItem('authToken', data.token);
  
  // Set session
  session = {
    role: data.user.role,
    name: data.user.name,
    patientId: data.user.healthId,
    email: data.user.email,
    phone: data.user.phone,
    userId: data.user.id
  };
  
  // Redirect to dashboard
  afterLogin();
}
```

### Auto-Login
```javascript
// On page load, check for existing token
const token = localStorage.getItem('authToken');

if (token) {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    // User is still logged in, restore session
    session = { ...data.user };
    afterLogin();
  } else {
    // Token expired, remove it
    localStorage.removeItem('authToken');
  }
}
```

### Protected API Calls
```javascript
// Include JWT token in requests to protected endpoints
const response = await fetch(`${API_BASE_URL}/files`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }
});
```

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String,              // Optional, unique, lowercase
  phone: String,              // Optional, unique
  name: String,               // Required
  role: String,               // enum: patient, hospital, oldage, pathology, dementia
  pinHash: String,            // Bcrypt hash of PIN
  pinSet: Boolean,            // Whether PIN has been set
  healthId: String,           // Unique identifier (e.g., MEDRAVIKU12345)
  otpEnabled: Boolean,        // For future OTP implementation
  otpSecret: String,          // For future TOTP implementation
  failedLoginAttempts: Number,  // Counter for failed attempts
  accountLockedUntil: Date,   // Null or future timestamp
  lastLoginAt: Date,          // Last successful login
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog Model
```javascript
{
  userId: ObjectId,           // Reference to User (optional)
  action: String,             // enum: LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, etc.
  identifier: String,         // Email or phone used for action
  ipAddress: String,          // Client IP
  userAgent: String,          // Browser info
  success: Boolean,           // Whether action succeeded
  failureReason: String,      // Optional error message
  metadata: Object,           // Additional context
  timestamp: Date
}
```

## 🚀 Future: OTP Integration

The system is designed to easily add OTP functionality at launch:

### 1. Enable OTP in User Profile
```javascript
// Add OTP generation logic
user.otpEnabled = true;
user.otpSecret = generateOTPSecret();
await user.save();
```

### 2. Implement Request OTP Endpoint
```javascript
router.post('/request-otp', async (req, res) => {
  const { identifier, method } = req.body;
  
  // Find user
  const user = await User.findByEmailOrPhone(identifier);
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  
  // Store OTP with 5-minute expiry (use Redis or in-memory cache)
  await cacheOTP(user._id, otp, 300); // 5 minutes
  
  // Send OTP via email or SMS
  if (method === 'email') {
    await sendOTPEmail(user.email, otp);
  } else {
    await sendOTPSMS(user.phone, otp);
  }
  
  // Log audit event
  await logAuditEvent({
    userId: user._id,
    action: 'OTP_SENT',
    identifier,
    success: true,
    metadata: { method }
  });
  
  res.json({ success: true, message: 'OTP sent successfully' });
});
```

### 3. Implement Verify OTP Endpoint
```javascript
router.post('/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;
  
  // Find user
  const user = await User.findByEmailOrPhone(identifier);
  
  // Retrieve stored OTP
  const storedOTP = await getCachedOTP(user._id);
  
  // Verify OTP
  if (storedOTP && storedOTP === otp) {
    // Clear OTP from cache
    await clearCachedOTP(user._id);
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Log success
    await logAuditEvent({
      userId: user._id,
      action: 'OTP_VERIFIED',
      identifier,
      success: true
    });
    
    res.json({ success: true, token, user: {...} });
  } else {
    // Log failure
    await logAuditEvent({
      userId: user._id,
      action: 'OTP_FAILED',
      identifier,
      success: false,
      failureReason: 'Invalid OTP'
    });
    
    res.status(401).json({ success: false, error: 'Invalid OTP' });
  }
});
```

### 4. Frontend Changes
The frontend already has placeholder UI for OTP. Simply:
- Uncomment OTP section in index.html
- Connect to /request-otp and /verify-otp endpoints
- Existing PIN flow remains as fallback option

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

Dependencies already in package.json:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - PIN hashing
- `jsonwebtoken` - JWT generation/verification
- `dotenv` - Environment variables

### 2. Configure Environment
Create `backend/.env`:
```env
# MongoDB connection (required for authentication)
MONGODB_URI=mongodb://localhost:27017/sehatsphere
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sehatsphere

# JWT configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=30m

# Server port
PORT=3001
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### 4. Run Backend
```bash
cd backend
npm start

# Or for development with auto-reload:
npm run dev
```

### 5. Update Frontend API URL
In `index.html` or `script.js`:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
// Or your deployed backend URL:
// const API_BASE_URL = 'https://sehatsphere.onrender.com/api';
```

### 6. Test Authentication
1. Open frontend in browser
2. Click "Create New Account"
3. Enter email/phone, name, and create a PIN
4. Login with the same credentials
5. Try wrong PIN 3 times to test account locking

## 🧪 Testing

### Manual Testing Checklist
- [ ] Register new user with email
- [ ] Register new user with phone
- [ ] Login with correct credentials
- [ ] Login with wrong PIN (verify remaining attempts)
- [ ] Trigger account lock (3 wrong attempts)
- [ ] Wait 10 minutes or manually clear lock
- [ ] Change PIN from settings
- [ ] Auto-login with valid token
- [ ] Token expiry handling
- [ ] Remember me functionality

### API Testing with curl

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "pin": "1234",
    "role": "patient"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "pin": "1234"
  }'
```

**Verify Token:**
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Best Practices

### Security
1. ✅ Never log PINs or tokens
2. ✅ Always use HTTPS in production
3. ✅ Set strong JWT_SECRET in production
4. ✅ Implement rate limiting at API gateway level
5. ✅ Regular audit log review
6. ✅ Clear tokens on logout

### User Experience
1. ✅ Show clear error messages
2. ✅ Indicate remaining login attempts
3. ✅ Auto-login with valid token
4. ✅ Remember me functionality
5. ✅ Easy PIN reset flow (coming soon)

### Code Quality
1. ✅ Comprehensive error handling
2. ✅ Clear comments for future OTP integration
3. ✅ Modular, reusable code
4. ✅ Consistent API response format
5. ✅ Proper validation at all layers

## 🐛 Troubleshooting

### "MongoDB connection error"
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network connectivity

### "Token expired"
- Normal behavior after 30 minutes
- User needs to login again
- Adjust JWT_EXPIRY if needed

### "Account locked"
- Wait 10 minutes or manually clear:
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
)
```

### CORS errors
- Backend already has CORS enabled
- Check API_BASE_URL matches backend URL
- Verify backend is running

## 📚 Additional Resources

- [bcrypt documentation](https://github.com/kelektiv/node.bcrypt.js)
- [JWT.io](https://jwt.io) - JWT debugger
- [MongoDB documentation](https://docs.mongodb.com)
- [Express.js guide](https://expressjs.com/en/guide/routing.html)

## 🎯 Next Steps

1. **Add PIN Reset Flow**
   - Email verification
   - Security questions
   - Admin intervention

2. **Implement OTP at Launch**
   - Email OTP delivery
   - SMS OTP via Twilio
   - TOTP authenticator app support

3. **Enhanced Security**
   - IP-based rate limiting
   - Device fingerprinting
   - Suspicious activity detection

4. **Multi-factor Authentication**
   - PIN + OTP
   - Biometric support (face/fingerprint)
   - Hardware token support

---

**Built with ❤️ for SehatSphere MVP**
