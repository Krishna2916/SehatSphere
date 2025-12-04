# Deploying SehatSphere Backend to Render

This document explains how to deploy the SehatSphere backend on Render (recommended for MVP).

Prerequisites
- A Render account (https://render.com)
- A MongoDB Atlas cluster (or accessible MongoDB instance)
- An AWS account with an S3 bucket and an IAM user that has permission to put objects in the bucket

Steps

1. Push your repo to GitHub

2. Create a new Web Service on Render
- Connect your GitHub repo
- Select the `backend` directory as the root (if Render asks for a root path, set to `backend`)
- Branch: `main`
- Build Command: `npm install`
- Start Command: `npm start`

3. Add Environment Variables (Render dashboard -> Service -> Environment)
Set the following env variables exactly (use values for your accounts):

- `PORT` — `3001` (optional)
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — a secure random string
- `GMAIL_USER` — (optional) for email OTP
- `GMAIL_PASSWORD` — (optional)
- `TWILIO_ACCOUNT_SID` — (optional)
- `TWILIO_AUTH_TOKEN` — (optional)
- `TWILIO_PHONE` — (optional)

AWS (S3)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET`

4. (Optional) Run readiness script
After env vars are added, you can run the readiness checker to ensure everything is set. On Render you can run commands in the shell, or run locally:

```bash
cd backend
node scripts/check_env.js
```

5. Deploy
Render will build and start the service. The backend will be available at e.g. `https://<your-service>.onrender.com`.

6. Frontend configuration
- Update the frontend to use the deployed API base URL. In `script.js` the default is `http://localhost:3001/api`. After deployment change to:

```js
const API_BASE_URL = 'https://<your-service>.onrender.com/api';
```

Or set `window.API_BASE_URL` in a small `config.js` loaded before `script.js`.

Notes and Troubleshooting
- S3 permissions: ensure the IAM user has `s3:PutObject` on the target bucket and optional `s3:GetObject`.
- CORS: backend uses `cors()` by default. If you need to restrict origins, update `server.js`.
- MongoDB Atlas: whitelist Render's IP ranges or enable access from anywhere (0.0.0.0/0) for testing.

Security
- Do NOT commit actual credentials. Use Render's environment variables feature to keep secrets safe.

Next steps
- After successful deploy, consider hosting the frontend on Vercel or Render static site and updating `API_BASE_URL`.
- For production, consider using HTTPS-only S3 buckets and stricter IAM policies.
