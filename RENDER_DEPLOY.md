# 🚀 Deploy SehatSphere to Render (Production)

This guide will deploy your SehatSphere app to the cloud in **~10 minutes**.

---

## ⚡ Quick Start (Recommended)

### Prerequisites
- GitHub account ✅ (you have this)
- Render account (free)
- 5-10 minutes

---

## 📋 Step-by-Step Deployment

### **Phase 1: Set Up MongoDB (Database)**

**Option A: Free MongoDB Atlas (Recommended)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Sign Up** (use your GitHub account)
3. Create Organization & Project
4. Click **Build a Cluster** → Free Tier
5. Choose region (pick closest to your users)
6. Wait for cluster to deploy (~5 min)
7. **Get Connection String:**
   - Click **Connect** button
   - Choose **Drivers** → **Node.js**
   - Copy the connection string: `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/sehatdb`
8. **Update username/password:**
   - Go to **Database Access**
   - Create new user (remember password)
   - Go to **Network Access** → Add `0.0.0.0/0` (for MVP)
   - Copy updated connection string with real credentials

**Save this string — you'll need it in Step 2.**

---

### **Phase 2: Deploy Backend on Render**

1. Go to [render.com](https://render.com)
2. **Sign up** (with GitHub is easiest)
3. Click **Dashboard** → **New +** → **Web Service**
4. **Connect GitHub:**
   - Click "Connect account"
   - Authorize Render to access your repos
   - Select `Krishna2916/SehatSphere`
5. **Configure Service:**
   - **Name:** `sehatsphere-backend`
   - **Region:** Choose closest region
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`

6. **Add Environment Variables:**
   Click **Add Environment Variables** and add:
   
   | Key | Value |
   |-----|-------|
   | `PORT` | `3001` |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | Generate with: `openssl rand -hex 32` |
   | `MONGODB_URI` | Paste from MongoDB Atlas (Step 1) |
   
   **Generate JWT Secret (macOS/Linux):**
   ```bash
   openssl rand -hex 32
   # Output: a1b2c3d4e5f6...
   ```
   Copy this output into `JWT_SECRET` field.

7. Click **Create Web Service**
8. **Wait 2-3 minutes** for deploy
9. Once deployed, you'll see: `https://sehatsphere-backend-xxxx.onrender.com`
   - ✅ Test it: Visit `https://sehatsphere-backend-xxxx.onrender.com/api/health`
   - Should return: `{"status":"ok","time":"..."}`

**Copy this URL — you'll need it in Phase 3.**

---

### **Phase 3: Update Frontend Config**

**In your local repository:**

1. Open `config.js` and replace with your backend URL:

```javascript
// Production backend URL
const API_BASE_URL = "https://sehatsphere-backend-xxxx.onrender.com/api";

export default API_BASE_URL;
```

Replace `sehatsphere-backend-xxxx` with your actual Render backend name from Phase 2.

2. Save and commit:
```bash
cd ~/Desktop/SehatSphere
git add config.js
git commit -m "Update API URL for production on Render"
git push origin main
```

---

### **Phase 4: Deploy Frontend on Render**

1. Back on Render dashboard, click **New +** → **Static Site**
2. **Connect GitHub:**
   - Select `Krishna2916/SehatSphere`
3. **Configure:**
   - **Name:** `sehatsphere-frontend`
   - **Region:** Same as backend
   - **Branch:** `main`
   - **Build Command:** Leave empty
   - **Publish Directory:** `.` (root)
4. Click **Create Static Site**
5. **Wait 1-2 minutes** for deploy

You'll get a URL: `https://sehatsphere-frontend-xxxx.onrender.com`

---

## ✅ Verify Deployment

1. **Open Frontend:** Visit `https://sehatsphere-frontend-xxxx.onrender.com`
2. **Check Status Badge:**
   - Look at top-right corner
   - Should show **"Backend: Online"** with green gradient ✅
3. **Test Features:**
   - ✅ Login with a name
   - ✅ Create Health ID
   - ✅ Ask AI a health question
   - ✅ Upload a file
   - ✅ Check "My Reports"

---

## 🔄 Auto-Deployment

Any time you push to GitHub `main` branch:
- Backend auto-redeploys (if you edit `backend/` folder)
- Frontend auto-redeploys (if you edit root files)

**No manual redeploy needed!**

---

## 📊 Monitor Your App

**View Backend Logs:**
1. Render Dashboard → sehatsphere-backend
2. Click **Logs** tab

**View Frontend Logs:**
1. Render Dashboard → sehatsphere-frontend
2. Click **Logs** tab

---

## 🐛 Troubleshooting

### **Backend shows "Offline" in UI**
- Check Render backend logs for errors
- Verify MongoDB connection string in env vars
- Ensure `JWT_SECRET` is set

### **Files won't upload**
- Backend must be "Online" (green)
- Check browser console (F12) for errors
- Uploads save locally if backend offline

### **Pages load but API calls fail**
- Open browser DevTools (F12)
- Check Console for CORS errors
- Verify backend URL in `config.js`

### **Render build fails**
- Check build logs in Render dashboard
- Ensure `backend/package.json` exists
- Run locally: `cd backend && npm install`

---

## 📱 Share Your App

Once deployed, share these URLs:
- **Frontend (for users):** `https://sehatsphere-frontend-xxxx.onrender.com`
- **Backend API (for developers):** `https://sehatsphere-backend-xxxx.onrender.com/api`

---

## 🎯 What's Next?

After successful deployment:

1. **Monitor:** Check logs daily
2. **Enhance:** Add more features
3. **Database:** Optional—add real MongoDB storage
4. **Authentication:** Optional—add user login system
5. **Scaling:** Upgrade Render plan if needed

---

## 📞 Support

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **MongoDB Docs:** [mongodb.com/docs](https://www.mongodb.com/docs)
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ✨ Summary

| Component | Where | Status |
|-----------|-------|--------|
| Backend Code | GitHub + Render | 🔄 Auto-deploy |
| Frontend Code | GitHub + Render | 🔄 Auto-deploy |
| Database | MongoDB Atlas | ☁️ Cloud |
| Uptime | 24/7 | ✅ Always on |
| Cost | Free tier | 💰 $0/month |

---

**Your SehatSphere app is now live on the cloud! 🎉**
