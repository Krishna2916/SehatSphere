# SehatSphere PIN Authentication - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install MongoDB

**Option A: Local MongoDB**
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download from: https://www.mongodb.com/try/download/community
# Run the installer and start MongoDB service

# Linux
sudo apt-get install mongodb-org
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster (Free tier available)
4. Get your connection string
5. Use it in .env file

### Step 2: Configure Backend

```bash
cd backend

# Copy environment template
cp .env.template .env

# Edit .env file with your settings
# At minimum, set MONGODB_URI and JWT_SECRET
```

**Example `.env` file:**
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/sehatsphere

# Generate a secure JWT secret:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-generated-secure-random-string-here

JWT_EXPIRY=30m
PORT=3001
```

### Step 3: Initialize Database

```bash
# Install dependencies (if not already done)
npm install

# Initialize database (creates indexes)
npm run init-db
```

You should see:
```
✅ Connected to MongoDB successfully
✅ User indexes created
✅ AuditLog indexes created
✅ Database initialization complete!
```

### Step 4: Start Backend

```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
SehatSphere backend running on port 3001
```

### Step 5: Update Frontend API URL

Edit `script.js` (around line 8):
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

Or if deployed:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Step 6: Test Authentication

1. Open `index.html` in your browser
2. Click "Create New Account"
3. Fill in the form:
   - Email: `test@example.com`
   - Phone: `+91 98765 43210` (optional)
   - Secure PIN: `1234` (4 or 6 digits)
   - Name: `Test User`
   - Role: Patient
4. Click "Complete Registration"

You should see:
- ✅ "Account created successfully! Welcome to SehatSphere."
- Redirect to dashboard

5. Logout and try logging in again:
   - Email: `test@example.com`
   - PIN: `1234`
   - Click "Sign In with PIN"

## ✅ Verification Checklist

- [ ] MongoDB is running and accessible
- [ ] Backend starts without errors
- [ ] Frontend can reach backend (check browser console)
- [ ] Can create new account
- [ ] Can login with correct credentials
- [ ] Wrong PIN shows error message
- [ ] 3 wrong attempts locks account
- [ ] Auto-login works after refresh
- [ ] Logout clears session

## 🔍 Testing Features

### Test Account Locking
1. Login with wrong PIN 3 times
2. Verify account is locked for 10 minutes
3. Check error message shows remaining time

### Test JWT Token
1. Login successfully
2. Open browser DevTools → Application → LocalStorage
3. Verify `authToken` is stored
4. Refresh page - should auto-login

### Test API Directly

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "name": "API Test User",
    "pin": "5678",
    "role": "patient"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "api-test@example.com",
    "pin": "5678"
  }'
```

**Verify (replace TOKEN with actual token from login):**
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer TOKEN"
```

## 🐛 Troubleshooting

### Backend won't start

**Error: "MongoDB connection error"**
```bash
# Check if MongoDB is running
# macOS:
brew services list | grep mongodb

# Linux:
sudo systemctl status mongod

# Windows:
# Check Services app for MongoDB service
```

**Error: "Port 3001 already in use"**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
PORT=3002
```

### Frontend can't connect to backend

1. Check backend is running on correct port
2. Check API_BASE_URL in script.js
3. Open browser console for errors
4. Check CORS settings in backend

### Can't login after registration

1. Check MongoDB has the user:
```javascript
// In MongoDB Compass or mongo shell
db.users.find({ email: "your-email@example.com" })
```

2. Verify PIN is being hashed:
```javascript
// Should see pinHash starting with "$2a$"
```

3. Check browser console for errors

### Account is locked

**Clear lock manually:**
```javascript
// MongoDB shell or Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  {
    $set: {
      failedLoginAttempts: 0,
      accountLockedUntil: null
    }
  }
)
```

**Or wait 10 minutes**

## 📚 Next Steps

1. **Read Full Documentation**
   - See `AUTH_DOCUMENTATION.md` for complete API reference
   - Understand security features and best practices

2. **Deploy to Production**
   - Use MongoDB Atlas for database
   - Deploy backend to Render/Heroku/Railway
   - Update frontend API_BASE_URL
   - Set secure JWT_SECRET in production

3. **Add OTP (Future)**
   - Configure email service (SMTP)
   - Set up Twilio for SMS
   - Uncomment OTP endpoints
   - Update frontend UI

4. **Enhance Security**
   - Enable HTTPS
   - Add rate limiting middleware
   - Implement IP blocking
   - Add security headers

## 🎯 Production Deployment

### Backend (Render/Heroku)

1. Push code to GitHub
2. Connect to Render/Heroku
3. Set environment variables:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (strong random string)
   - `JWT_EXPIRY=30m`
   - `PORT=3001`

4. Deploy and get backend URL

### Frontend (GitHub Pages/Netlify)

1. Update `script.js`:
```javascript
const API_BASE_URL = 'https://your-backend.onrender.com/api';
```

2. Deploy to GitHub Pages or Netlify

3. Test registration and login

## 💡 Pro Tips

1. **Development**
   - Use `npm run dev` for auto-reload
   - Keep MongoDB Compass open to monitor data
   - Use browser DevTools Network tab to debug API calls

2. **Security**
   - Never commit `.env` file
   - Use strong JWT_SECRET in production
   - Enable HTTPS in production
   - Review audit logs regularly

3. **Testing**
   - Create test accounts with different roles
   - Test on different devices
   - Verify email/phone validation

4. **Performance**
   - MongoDB indexes are created automatically
   - JWT tokens reduce database queries
   - Consider Redis for OTP caching later

## 🆘 Need Help?

- Check `AUTH_DOCUMENTATION.md` for detailed API docs
- Review code comments in backend files
- Check browser console for frontend errors
- Check backend logs for server errors
- Verify MongoDB connection in MongoDB Compass

---

**Happy coding! 🚀**

Built for SehatSphere MVP with ❤️
