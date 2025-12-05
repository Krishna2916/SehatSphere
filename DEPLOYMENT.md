# SehatSphere: Local & Cloud Deployment Guide

This guide explains how to set up, test, and deploy the SehatSphere MVP backend and frontend for both local development and cloud (Render) deployment.

---

## 1. Local Development

### Backend Setup
1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Configure environment:**
   - Copy `.env.example` to `.env` in the `backend/` folder:
     ```bash
     cp .env.example .env
     ```
   - Fill in values for MongoDB, JWT, and (optionally) AWS S3, Gmail, Twilio. For pure local file upload, S3 is not required.
3. **Start the backend:**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```
4. **Test health and upload endpoints:**
   - Health: [http://localhost:3001/api/health](http://localhost:3001/api/health)
   - Local upload: `POST /api/upload` (see backend/README.md for curl example)

### Frontend Setup
1. **Set API base URL:**
   - In `config.js`, ensure:
     ```js
     const API_BASE_URL = "http://localhost:3001/api";
     export default API_BASE_URL;
     ```
   - Or, for static hosting, use `config.template.js` and set `window.API_BASE_URL` before loading `script.js`.
2. **Open `index.html` in your browser.**

---

## 2. Cloud Deployment

### Option A: Render (Recommended for MVP)

#### Backend Deployment
1. **Push your code to GitHub** (already done ✅)
2. **Create a new Web Service on Render:**
   - Go to [render.com](https://render.com) → Dashboard → New + → Web Service
   - Connect your GitHub repository
   - Set **Root Directory:** `backend/`
   - Set **Build Command:** `npm install`
   - Set **Start Command:** `npm start`
3. **Set environment variables** in Render dashboard:
   - `PORT`: `3001` (Render assigns port automatically)
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong random secret (e.g., `openssl rand -hex 32`)
   - `AWS_ACCESS_KEY_ID`: (Optional, for S3 uploads)
   - `AWS_SECRET_ACCESS_KEY`: (Optional, for S3 uploads)
   - `S3_BUCKET`: (Optional, for S3 uploads)
   - `NODE_ENV`: `production`
4. **Deploy:** Click "Create Web Service" and wait for build to complete.
5. **Verify:** Test health endpoint at `https://<your-service>.onrender.com/api/health`

#### Frontend Deployment on Render
1. **Create a Static Site on Render:**
   - New + → Static Site
   - Connect your GitHub repository
   - Set **Root Directory:** `/` (root of repo)
   - Set **Build Command:** (leave empty, or `npm run build` if you add build step)
   - Set **Publish Directory:** `/` (serves `index.html`)
2. **Update `config.js` for production:**
   ```js
   const API_BASE_URL = "https://<your-backend-service>.onrender.com/api";
   export default API_BASE_URL;
   ```
3. **Deploy:** Render will host your frontend at `https://<your-static-site>.onrender.com`

---

### Option B: Heroku

#### Backend Deployment
1. **Install Heroku CLI:** `brew tap heroku/brew && brew install heroku` (macOS)
2. **Login:** `heroku login`
3. **Create app:**
   ```bash
   heroku create your-app-name
   ```
4. **Set buildpack for Node.js:**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```
5. **Set environment variables:**
   ```bash
   heroku config:set MONGODB_URI="<your-mongo-uri>" \
     JWT_SECRET="<strong-secret>" \
     AWS_ACCESS_KEY_ID="<optional>" \
     AWS_SECRET_ACCESS_KEY="<optional>" \
     S3_BUCKET="<optional>" \
     NODE_ENV="production"
   ```
6. **Specify Procfile:** Create `backend/Procfile`:
   ```
   web: node backend.js
   ```
7. **Deploy:**
   ```bash
   git push heroku main
   ```
8. **View logs:**
   ```bash
   heroku logs --tail
   ```

#### Frontend Deployment on Heroku
- Use Heroku's static buildpack or host on GitHub Pages/Vercel instead (Heroku is better for backend).

---

### Option C: AWS Elastic Beanstalk

#### Backend Deployment
1. **Install AWS CLI & EB CLI:**
   ```bash
   brew install awsebcli
   ```
2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```
3. **Initialize Elastic Beanstalk environment:**
   ```bash
   cd backend
   eb init -p node.js-20 your-app-name
   eb create your-env-name
   ```
4. **Set environment variables:**
   ```bash
   eb setenv MONGODB_URI="<uri>" JWT_SECRET="<secret>" AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." S3_BUCKET="..." NODE_ENV="production"
   ```
5. **Deploy:**
   ```bash
   eb deploy
   ```
6. **View logs:**
   ```bash
   eb logs
   ```

#### Frontend Deployment on AWS
- Use **AWS S3 + CloudFront** for static hosting:
  1. Create S3 bucket (enable static website hosting)
  2. Upload files to bucket
  3. Create CloudFront distribution pointing to bucket
  4. Update `config.js` with backend API URL

---

### Option D: Vercel (Frontend-friendly)

1. **Sign up at [vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Update `config.js` to use your Render/Heroku backend URL:**
   ```js
   const API_BASE_URL = "https://<your-backend>.onrender.com/api";
   export default API_BASE_URL;
   ```
4. **Deploy:** Vercel auto-deploys on every push to `main`

---

## 3. Environment Variables Reference

### Required Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port (auto-assigned by Render/Heroku) | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/sehatdb` |
| `JWT_SECRET` | Secret for JWT token signing | `your-random-hex-string` |
| `NODE_ENV` | Environment mode | `production` or `development` |

### Optional Variables (for S3 file uploads)
| Variable | Purpose | Example |
|----------|---------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `aws...` |
| `S3_BUCKET` | S3 bucket name for uploads | `sehatosphere-uploads` |

### Generate a Strong JWT Secret
```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows (PowerShell)
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Local Testing
Run the environment check script:
```bash
cd backend
node scripts/check_env.js
```

---

## 4. Deployment Checklist

### Before Deploying
- [ ] Code pushed to GitHub
- [ ] No `.env` file in repository (only `.env.example`)
- [ ] `node_modules/` in `.gitignore` (already done ✅)
- [ ] All secrets removed from git history
- [ ] Backend tested locally: `npm start` and `curl http://localhost:3001/api/health`
- [ ] File upload tested locally

### During Deployment
- [ ] Platform account created (Render/Heroku/AWS)
- [ ] Repository connected to platform
- [ ] All environment variables set in platform dashboard
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Root directory set to `backend/` (for backend deployment)

### After Deployment
- [ ] Backend health check passes: `curl https://<service-url>/api/health`
- [ ] Frontend API URL updated to point to deployed backend
- [ ] Frontend deployed (Render Static, Vercel, GitHub Pages, etc.)
- [ ] Test end-to-end: Upload file from frontend, verify in backend logs
- [ ] Monitor logs for errors: Use platform's dashboard or CLI

---

## 5. Setting Up MongoDB

### Option A: MongoDB Atlas (Cloud, Recommended)
1. **Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)**
2. **Create a free cluster:**
   - Organization → Create Cluster → Free Tier
   - Select region closest to you
3. **Create a database user:**
   - Security → Network Access → Add IP (0.0.0.0/0 for MVP, restrict later)
   - Database Access → Add Database User
4. **Get connection string:**
   - Clusters → Connect → Driver → Node.js
   - Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/sehatdb`
5. **Use in `.env` or Render/Heroku:**
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sehatdb
   ```

### Option B: Local MongoDB (Development only)
1. **Install MongoDB Community:** [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. **Start the service:**
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or run standalone
   mongod
   ```
3. **Connection string:**
   ```
   MONGODB_URI=mongodb://localhost:27017/sehatdb
   ```

---

## 6. Troubleshooting

### Common Issues

**Backend won't start: "Cannot find module"**
- Run: `cd backend && npm install`
- Clear cache: `npm cache clean --force`

**Health check fails: 503 Service Unavailable**
- Check MongoDB connection: `MONGODB_URI` env var is set and valid
- Run: `node backend/scripts/check_env.js`
- View logs: Use platform dashboard (Render/Heroku) or local `npm start`

**File upload returns 413 Payload Too Large**
- Backend default is 20 MB. Edit `backend/backend.js`:
  ```js
  const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
  });
  ```

**Frontend can't reach backend (CORS error)**
- Check backend URL in `config.js` matches deployed service
- Verify backend's CORS setting in `backend/backend.js`:
  ```js
  app.use(cors()); // Allow all origins (MVP). Restrict later.
  ```

**Render/Heroku build fails: "No such file or directory"**
- Verify root directory is set to `backend/` (not `/backend`)
- Run locally: `cd backend && npm install && npm start`

**S3 uploads fail: "Access Denied"**
- Verify AWS credentials have S3 permissions (AmazonS3FullAccess policy)
- Check bucket name matches `S3_BUCKET` env var
- For MVP, S3 is optional—local uploads work without it

---

## 7. Monitoring & Logs

### Render
- Dashboard → Service → Logs tab
- Real-time log streaming

### Heroku
```bash
heroku logs --tail         # Stream logs in real-time
heroku logs --num 50       # Show last 50 lines
heroku logs --dyno web.1   # Logs from specific dyno
```

### AWS Elastic Beanstalk
```bash
eb logs      # Download all logs
eb open      # Open app in browser
```

### Local
```bash
npm start    # Logs to console
```

---

## 8. Production Readiness Checklist

- [ ] **Security:**
  - [ ] All secrets in environment variables (not in code/git)
  - [ ] HTTPS enabled (all cloud platforms provide this)
  - [ ] Database password is strong
  - [ ] JWT secret is random & unique (32+ characters)
  - [ ] CORS restricted to frontend domain (update in `backend.js`)

- [ ] **Performance:**
  - [ ] File upload size limits appropriate (default 20 MB)
  - [ ] Database indexes created for frequently queried fields
  - [ ] API response times < 2 seconds

- [ ] **Monitoring:**
  - [ ] Error logs reviewed
  - [ ] Uptime monitoring set up (e.g., Uptime Robot)
  - [ ] Backup strategy for MongoDB (MongoDB Atlas auto-backups)

- [ ] **Scaling (when needed):**
  - [ ] Database queries optimized
  - [ ] Consider CDN for static files (CloudFront for S3)
  - [ ] Set up auto-scaling on Heroku/AWS for traffic spikes

---

## 9. References

- **Backend Details:** See `backend/README.md`
- **Backend Render Guide:** See `backend/DEPLOY_RENDER.md`
- **Environment Example:** See `backend/.env.example`
- **Health Check Script:** Run `node backend/scripts/check_env.js`

---

## 10. Quick Start Summary

### Deploy Backend on Render (5 minutes)
```bash
# 1. Already on GitHub? ✅ (done via git push)
# 2. Create Render account & Web Service
# 3. Set env vars (MONGODB_URI, JWT_SECRET, etc.)
# 4. Deploy — available at https://<service>.onrender.com/api/health
```

### Deploy Frontend on Vercel (2 minutes)
```bash
# 1. Push to GitHub
# 2. Import repo on vercel.com
# 3. Update config.js with backend URL
# 4. Deploy — auto-deployed on every push
```

### Full MVP to Production
- Backend: Render (5 min setup)
- Frontend: Vercel (2 min setup)  
- Database: MongoDB Atlas (free tier, 5 min setup)
- **Total time: ~15 minutes**
