# SehatSphere Authentication Testing Checklist

Use this checklist to verify your PIN authentication system is working correctly.

## ✅ Pre-Testing Setup

- [ ] MongoDB is running (local or Atlas)
- [ ] `.env` file configured with valid MongoDB URI and JWT_SECRET
- [ ] Backend started successfully (`npm run dev` in backend/)
- [ ] Frontend can access backend (check browser console)
- [ ] Database initialized (`npm run init-db`)

## 🧪 Registration Tests

### Valid Registration
- [ ] Register with email only (no phone)
  - Email: `test1@example.com`
  - PIN: `1234`
  - Name: `Test User 1`
  - ✅ Account created successfully
  - ✅ JWT token received
  - ✅ Redirected to dashboard

- [ ] Register with phone only (no email)
  - Phone: `+91 9876543210`
  - PIN: `123456`
  - Name: `Test User 2`
  - ✅ Account created successfully
  - ✅ Unique Health ID generated

- [ ] Register with both email and phone
  - Email: `test3@example.com`
  - Phone: `+91 9876543211`
  - PIN: `5678`
  - Name: `Test User 3`
  - ✅ Both identifiers saved

### Invalid Registration
- [ ] Try to register without email OR phone
  - ❌ Error: "Either email or phone is required"

- [ ] Try to register with invalid PIN (3 digits)
  - PIN: `123`
  - ❌ Error: "PIN must be 4 or 6 digits"

- [ ] Try to register with invalid PIN (7 digits)
  - PIN: `1234567`
  - ❌ Error: "PIN must be 4 or 6 digits"

- [ ] Try to register with invalid PIN (letters)
  - PIN: `abcd`
  - ❌ Error: "PIN must be 4 or 6 digits"

- [ ] Try to register with name too short
  - Name: `A`
  - ❌ Error: "Valid name is required"

- [ ] Try to register with duplicate email
  - Email: `test1@example.com` (already exists)
  - ❌ Error: "User already exists with this email or phone"

- [ ] Try to register with duplicate phone
  - Phone: `+91 9876543210` (already exists)
  - ❌ Error: "User already exists with this email or phone"

## 🔐 Login Tests

### Successful Login
- [ ] Login with email + correct PIN
  - Email: `test1@example.com`
  - PIN: `1234`
  - ✅ Login successful
  - ✅ JWT token stored
  - ✅ Redirected to dashboard

- [ ] Login with phone + correct PIN
  - Phone: `+91 9876543210`
  - PIN: `123456`
  - ✅ Login successful

### Failed Login
- [ ] Login with wrong PIN (1st attempt)
  - Email: `test1@example.com`
  - PIN: `9999`
  - ❌ Error: "Invalid credentials"
  - ℹ️ Message: "2 attempt(s) remaining"

- [ ] Login with wrong PIN (2nd attempt)
  - Email: `test1@example.com`
  - PIN: `8888`
  - ❌ Error: "Invalid credentials"
  - ℹ️ Message: "1 attempt(s) remaining"

- [ ] Login with wrong PIN (3rd attempt - account locks)
  - Email: `test1@example.com`
  - PIN: `7777`
  - ❌ Error: "Account locked due to multiple failed attempts. Try again in 10 minutes."
  - ⏰ Lock time shown

- [ ] Try to login while account is locked
  - Email: `test1@example.com`
  - PIN: `1234` (correct PIN)
  - ❌ Error: "Account is locked. Try again in X minute(s)."

- [ ] Login with non-existent email
  - Email: `nonexistent@example.com`
  - PIN: `1234`
  - ❌ Error: "Invalid credentials"

- [ ] Login with empty identifier
  - Email: `` (empty)
  - PIN: `1234`
  - ❌ Error: "Please enter your email or phone number"

- [ ] Login with empty PIN
  - Email: `test1@example.com`
  - PIN: `` (empty)
  - ❌ Error: "Please enter your Secure PIN"

## 🔄 Session Management Tests

### JWT Token
- [ ] Verify token is stored in localStorage
  - Open DevTools → Application → LocalStorage
  - ✅ `authToken` key exists
  - ✅ Value is JWT format (3 parts separated by dots)

- [ ] Auto-login on page refresh
  - Login successfully
  - Refresh page (F5)
  - ✅ User automatically logged in
  - ✅ Dashboard shown (no login screen)

- [ ] Token verification endpoint
  - Get token from localStorage
  - Make API call: `GET /api/auth/verify`
  - ✅ Returns user data

### Logout
- [ ] Logout clears token
  - Click logout button
  - Check localStorage
  - ✅ `authToken` removed
  - ✅ Redirected to login screen

- [ ] Cannot access dashboard after logout
  - Logout
  - Try to manually navigate to dashboard
  - ✅ Login screen shown

## ⏰ Account Lock Tests

### Lock Mechanism
- [ ] Account locks after 3 failed attempts
  - Try wrong PIN 3 times
  - ✅ Account locked message shown
  - ✅ Lock duration displayed (10 minutes)

- [ ] Check database for lock
  ```javascript
  // MongoDB Compass or shell
  db.users.findOne({ email: "test1@example.com" })
  // ✅ failedLoginAttempts: 3
  // ✅ accountLockedUntil: [future date]
  ```

### Unlock Mechanism
- [ ] Manual unlock
  ```javascript
  // MongoDB Compass or shell
  db.users.updateOne(
    { email: "test1@example.com" },
    { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
  )
  ```
  - ✅ Can login again

- [ ] Auto-unlock after 10 minutes
  - Wait 10 minutes
  - Try to login with correct credentials
  - ✅ Login successful
  - ✅ `failedLoginAttempts` reset to 0

### Lock Reset on Success
- [ ] Successful login resets failed attempts
  - Fail once (1 attempt)
  - Login with correct PIN
  - Check database
  - ✅ `failedLoginAttempts` reset to 0

## 📝 Audit Log Tests

### Registration Events
- [ ] Check audit log for registration
  ```javascript
  // MongoDB Compass or shell
  db.auditlogs.find({ action: "REGISTER" }).sort({ timestamp: -1 })
  ```
  - ✅ Event logged
  - ✅ Contains user ID
  - ✅ Contains email/phone
  - ✅ Contains IP address
  - ✅ success: true

### Login Events
- [ ] Check audit log for successful login
  ```javascript
  db.auditlogs.find({ action: "LOGIN_SUCCESS" }).sort({ timestamp: -1 })
  ```
  - ✅ Event logged
  - ✅ Contains all details

- [ ] Check audit log for failed login
  ```javascript
  db.auditlogs.find({ action: "LOGIN_FAILED" }).sort({ timestamp: -1 })
  ```
  - ✅ Event logged
  - ✅ Contains failure reason
  - ✅ success: false

### Account Lock Events
- [ ] Check audit log for account lock
  ```javascript
  db.auditlogs.find({ action: "ACCOUNT_LOCKED" }).sort({ timestamp: -1 })
  ```
  - ✅ Event logged after 3 failed attempts
  - ✅ Contains lock timestamp

## 🔄 PIN Change Tests

### Successful PIN Change
- [ ] Login first
- [ ] Call change-pin endpoint
  ```bash
  curl -X POST http://localhost:3001/api/auth/change-pin \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "oldPin": "1234",
      "newPin": "5678"
    }'
  ```
  - ✅ Success message
  - ✅ Can login with new PIN
  - ✅ Cannot login with old PIN

### Failed PIN Change
- [ ] Try with wrong old PIN
  - oldPin: `9999` (wrong)
  - newPin: `5678`
  - ❌ Error: "Current PIN is incorrect"

- [ ] Try with invalid new PIN format
  - oldPin: `1234`
  - newPin: `12` (too short)
  - ❌ Error: "New PIN must be 4 or 6 digits"

- [ ] Try without authentication token
  - ❌ Error: "No token provided" or 401 Unauthorized

## 💾 Remember Me Tests

### Enabled
- [ ] Check "Remember me" before login
- [ ] Login successfully
- [ ] Close browser
- [ ] Open browser again
- [ ] Check login form
  - ✅ Email/phone pre-filled
  - ✅ Name pre-filled
  - ✅ Role pre-selected
  - ❌ PIN NOT saved (security)

### Disabled
- [ ] Uncheck "Remember me"
- [ ] Login
- [ ] Close browser
- [ ] Open browser again
- [ ] Check login form
  - ✅ All fields empty

## 🌐 API Direct Tests

Use these curl commands to test the API directly:

### Health Check
```bash
curl http://localhost:3001/api/health
```
- ✅ Returns status, timestamp, database status

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl-test@example.com",
    "name": "Curl Test User",
    "pin": "9876",
    "role": "patient"
  }'
```
- ✅ Returns token and user data

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "curl-test@example.com",
    "pin": "9876"
  }'
```
- ✅ Returns token and user data

### Verify Token
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- ✅ Returns user data

## 🎨 UI/UX Tests

### Login Screen
- [ ] PIN input shows numeric keyboard on mobile
- [ ] PIN input maxLength is 6
- [ ] Success messages appear and disappear
- [ ] Error messages are clear and helpful
- [ ] Loading states shown during API calls
- [ ] Buttons disabled during requests

### Signup Mode
- [ ] Clicking "Create New Account" shows name and role fields
- [ ] Button text changes to "Complete Registration"
- [ ] Login button text changes to "Back to Sign In"
- [ ] Can toggle back to login mode

### Notifications
- [ ] Success notifications are green
- [ ] Error notifications are red
- [ ] Info notifications are blue
- [ ] Notifications auto-dismiss after 3 seconds
- [ ] Multiple notifications stack properly

## 🔒 Security Tests

### PIN Hashing
- [ ] Check database for PIN storage
  ```javascript
  db.users.findOne({ email: "test1@example.com" })
  ```
  - ✅ `pinHash` starts with `$2a$` (bcrypt)
  - ✅ PIN never stored in plain text
  - ❌ No `pin` field in database

### JWT Secret
- [ ] Verify JWT_SECRET is set in .env
- [ ] Try to decode JWT token
  - Go to [jwt.io](https://jwt.io)
  - Paste token
  - ✅ Contains: userId, email, phone, role, healthId
  - ❌ Does NOT contain: PIN, password

### Network Security
- [ ] Check browser Network tab during login
  - ✅ PIN sent over POST (not GET)
  - ✅ PIN in request body (not URL)
  - ❌ PIN NOT visible in network logs

## 📊 Database Verification

### Users Collection
```javascript
db.users.find().pretty()
```
- [ ] All users have unique `_id`
- [ ] All users have unique `healthId`
- [ ] All users have `pinHash` (not `pin`)
- [ ] All users have `pinSet: true`
- [ ] Emails are lowercase
- [ ] No duplicate emails or phones

### Audit Logs Collection
```javascript
db.auditlogs.find().sort({ timestamp: -1 }).limit(10).pretty()
```
- [ ] Recent events logged
- [ ] IP addresses captured
- [ ] User agents captured
- [ ] Success/failure tracked
- [ ] Timestamps are recent

### Indexes
```javascript
db.users.getIndexes()
db.auditlogs.getIndexes()
```
- [ ] Users indexed on email
- [ ] Users indexed on phone
- [ ] Users indexed on healthId
- [ ] AuditLogs indexed on userId, identifier, timestamp

## 🚀 Production Readiness

### Environment
- [ ] `.env` file NOT committed to git
- [ ] `.env.template` exists with all variables
- [ ] Strong JWT_SECRET in production
- [ ] MongoDB Atlas or production database configured
- [ ] HTTPS enabled in production

### Error Handling
- [ ] Backend errors don't expose sensitive data
- [ ] Frontend shows user-friendly error messages
- [ ] Database errors logged but not shown to users
- [ ] Network errors handled gracefully

### Performance
- [ ] Login completes in < 2 seconds
- [ ] Registration completes in < 2 seconds
- [ ] Database queries are indexed
- [ ] No memory leaks in long-running sessions

## ✅ Final Checklist

- [ ] All above tests pass
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Database has test data
- [ ] Audit logs are being created
- [ ] Documentation is accurate
- [ ] Code is clean and commented
- [ ] Ready for production deployment

---

## 📝 Test Results

**Date Tested:** _________________

**Tester:** _________________

**Environment:** _________________
- [ ] Local Development
- [ ] Staging
- [ ] Production

**Overall Status:**
- [ ] ✅ All Tests Passed
- [ ] ⚠️ Some Tests Failed (note below)
- [ ] ❌ Critical Failures (do not deploy)

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Happy Testing! 🧪**
