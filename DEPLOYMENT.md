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

## 2. Cloud Deployment (Render)

### Backend
1. **Push your code to GitHub.**
2. **Create a new Web Service on Render:**
   - Root: `backend/`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Set environment variables** in Render dashboard (see `.env.example`). Required: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `AWS_*` for S3 uploads.
4. **(Optional) Run readiness check:**
   ```bash
   cd backend
   node scripts/check_env.js
   ```
5. **Deploy.** Backend will be available at `https://<your-service>.onrender.com`.

### Frontend
1. **Set API base URL for production:**
   - In `config.js` or `config.template.js`, set:
     ```js
     window.API_BASE_URL = 'https://<your-service>.onrender.com/api';
     ```
2. **Host frontend** (e.g., GitHub Pages, Vercel, or Render static site).

---

## 3. Environment Variables
- See `backend/.env.example` for all required and optional variables.
- Never commit secrets to git. Use Render's environment settings for production.

---

## 4. Troubleshooting
- **Check env vars:** `node backend/scripts/check_env.js`
- **Logs:** Use Render dashboard or `npm start` locally.
- **CORS:** Backend uses `cors()` by default. Restrict origins in `server.js` if needed.
- **Uploads:** For MVP, `/api/upload` saves files locally. For S3, configure AWS vars.

---

## 5. References
- See `backend/README.md` and `backend/DEPLOY_RENDER.md` for more details.
