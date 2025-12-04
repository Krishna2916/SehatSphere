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

Local Upload Endpoint (MVP)
---------------------------
For MVP testing we added a simple local upload endpoint that saves files to the server filesystem (no S3 required):

- Endpoint: `POST /api/upload`
- Form field name: `file` (multipart/form-data)
- Additional optional form fields: `patientId`, `type`, `profile`, `testName`
- Accepted file types: `.pdf`, `.doc`, `.docx` (max 20 MB)

On success the endpoint returns JSON like:

```json
{ "success": true, "fileName": "1600000000000-report.pdf", "originalName": "report.pdf", "path": "/uploads/1600000000000-report.pdf" }
```

The server serves uploaded files statically at `/uploads/<filename>`, so the returned `path` can be used directly from the frontend (e.g. `http://localhost:3001/uploads/160000...-report.pdf`).

Example `curl` upload
---------------------
From a terminal you can test with:

```bash
curl -v -F "file=@/path/to/report.pdf" -F "patientId=MEDABC123" http://localhost:3001/api/upload
```

Quick local run (backend)
-------------------------
Install dependencies and start the backend from the `backend/` directory:

```bash
cd backend
npm install
npm start
```

The server listens on `PORT` (default `3001`). The frontend can be served separately (static hosting) and should set `API_BASE_URL` to `http://localhost:3001/api` when testing locally.

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
