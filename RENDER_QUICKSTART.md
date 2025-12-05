# 🚀 Render Deployment - Quick Start

## Step 1: Deploy to Render (5 minutes)

### Option A: One-Click Deploy (Recommended)
1. Go to: https://render.com/
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select **"Build and deploy from a Git repository"**
5. Click **"Connect account"** → Authorize Render to access your GitHub
6. Find and select: **`Krishna2916/SehatSphere`**
7. Click **"Connect"**

### Configuration Settings:
```
Name: sehatsphere-backend
Region: Oregon (US West)
Branch: main
Root Directory: (leave blank)
Runtime: Node
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Instance Type: Free
```

### Step 2: Add Environment Variables

In the Render dashboard, scroll to **"Environment Variables"** section and add:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `844c98875ae2173302817d32e6fed916df71a67d9d31f3256fe2a2181b6879ac` |
| `MONGODB_URI` | `<your-mongodb-connection-string>` |

**⚠️ Important:** Replace `<your-mongodb-connection-string>` with your actual MongoDB Atlas connection string.

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sehatdb`

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment to complete
3. You'll get a URL like: `https://sehatsphere-backend.onrender.com`

### Step 4: Test Your Backend

Once deployed, test the health endpoint:
```bash
curl https://sehatsphere-backend.onrender.com/api/health
```

Expected response:
```json
{"status":"ok","time":"2025-12-05T..."}
```

---

## Troubleshooting

### If deployment fails:
1. Check **"Logs"** tab in Render dashboard
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection string is valid
4. Check that Node.js version is compatible (v18+ recommended)

### If health check fails:
- Wait 30 seconds after deployment (Render free tier has cold starts)
- Check logs for connection errors
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### Free Tier Limitations:
- ✅ 750 hours/month (enough for always-on)
- ✅ Automatic HTTPS
- ⚠️ Sleeps after 15 min of inactivity (30s cold start)
- ⚠️ Slower than paid tiers

---

## After Successful Deployment

**Copy your Render URL** (e.g., `https://sehatsphere-backend.onrender.com`) and provide it to complete the frontend configuration.

Your backend will be live at:
- Health Check: `https://your-app.onrender.com/api/health`
- File Upload: `https://your-app.onrender.com/api/upload`
- AI Assistant: `https://your-app.onrender.com/api/ai/query`

---

## Need MongoDB Atlas Setup?

If you haven't set up MongoDB yet, see [DEPLOYMENT.md](DEPLOYMENT.md#mongodb-atlas-setup) for detailed instructions.

Quick MongoDB setup:
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster (512MB)
3. Create database user
4. Add IP: 0.0.0.0/0 (allow from anywhere)
5. Get connection string
6. Replace username/password in string
7. Use in Render's `MONGODB_URI` environment variable
