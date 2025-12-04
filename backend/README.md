# SehatSphere Backend (MVP)

This backend provides simple APIs for:
- Health check: `GET /api/health`
- File uploads (S3): `POST /api/files/upload` (multipart/form-data)
- Placeholder AI: `POST /api/ai/analyzeSymptoms`

Setup
1. Install dependencies:

```bash
cd backend
npm install
```

2. Create `.env` from `.env.example` and fill AWS, MongoDB and other keys.

3. Start server:

```bash
npm start
# or for development
npm run dev
```

Notes
- File uploads use AWS S3 (configured via env vars). Uploaded files are stored under `<S3_BUCKET>/<patientId>/<timestamp>-<filename>`.
- AI endpoint is a placeholder for now. Replace with an LLM integration later.

Render Deployment
-----------------
See `DEPLOY_RENDER.md` for step-by-step instructions to deploy this backend to Render with MongoDB Atlas and AWS S3.

Readiness Check
---------------
Run the environment readiness script to verify necessary env vars are set:

```bash
node scripts/check_env.js
```

If the script lists missing variables, add them in your Render environment settings or `.env` for local testing.
