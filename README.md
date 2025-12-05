# 🏥 SehatSphere — Smart Healthcare App MVP

A simplified, elder-friendly health management application with AI assistance, medical record storage, and appointment tracking.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- Python 3.7+ (for frontend dev server)
- Git

### Option 1: One-Command Start (Recommended)

**macOS/Linux:**
```bash
bash run-dev.sh
```

**Windows:**
```bash
run-dev.bat
```

Then open **http://localhost:8000** in your browser.

---

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

---

## 📱 Features

- **Patient Registration** – Create unique Health IDs
- **Medical Profile** – Store vitals, medications, prescriptions
- **Health Queries** – AI-powered symptom analysis (placeholder)
- **File Uploads** – Upload medical reports to backend
- **Test Results** – Track lab tests and results
- **Appointments** – Schedule and manage appointments
- **Local-First** – Works offline with localStorage, syncs when backend available
- **Backend Status** – Visual indicator of backend connectivity

---

## 🔧 Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check backend health |
| `/api/upload` | POST | Upload medical file (local storage) |
| `/api/files/upload` | POST | Upload to S3 (if configured) |
| `/api/ai/analyzeSymptoms` | POST | AI symptom analysis (placeholder) |

**Example: Check health**
```bash
curl http://localhost:3001/api/health
# Output: {"status":"ok","time":"2025-12-05T07:38:06.574Z"}
```

**Example: Upload file**
```bash
curl -F "file=@report.pdf" \
     -F "patientId=MEDUSER12345" \
     http://localhost:3001/api/upload
```

---

## 🗂️ Project Structure

```
SehatSphere/
├── index.html           # Main frontend (elder-friendly UI)
├── script.js            # Frontend logic & API calls
├── style.css            # Styling
├── config.js            # API configuration
├── config.template.js   # Template for deployment
├── assets/              # Images & resources
├── backend/
│   ├── backend.js       # Express server
│   ├── package.json     # Dependencies
│   ├── routes/
│   │   ├── upload.js    # Upload endpoint
│   │   ├── ai.js        # AI endpoint
│   │   └── files.js     # S3 upload endpoint
│   ├── models/
│   │   └── File.js      # File schema
│   ├── scripts/
│   │   └── check_env.js # Environment validator
│   └── .env.example     # Environment template
├── DEPLOYMENT.md        # Cloud deployment guide
└── run-dev.sh / .bat    # Dev server startup
```

---

## ⚙️ Configuration

### Local Development (No Backend)
- Frontend works standalone with localStorage
- Backend shows as "Offline" but app functions normally
- Files saved locally, not uploaded

### With Local Backend
1. Start backend: `npm start` (from `backend/` folder)
2. Frontend automatically detects it
3. Backend status shows "Online" (green)
4. Files can be uploaded to server

### For Cloud Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Render (recommended)
- Heroku
- AWS Elastic Beanstalk
- Vercel (frontend)
- MongoDB Atlas setup

---

## 🛠️ Development

### Running Tests
```bash
cd backend
npm run test-upload  # Test file upload endpoint
```

### Backend Environment Variables
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Fill in:
- `MONGODB_URI` – MongoDB connection (optional for MVP)
- `JWT_SECRET` – Secret for tokens (optional)
- `AWS_*` – S3 credentials (optional)

### Check Environment
```bash
node backend/scripts/check_env.js
```

---

## 📋 Frontend Sections

1. **Login** – Register or sign in with Health ID
2. **Dashboard** – Overview of health data
3. **My Profile** – Patient info, vitals, medications
4. **My Prescriptions** – View prescriptions
5. **My Test Reports** – Upload & track lab reports
6. **My Issues** – Track health concerns
7. **My Appointments** – Schedule appointments
8. **AI Health Query** – Ask health questions (AI response)
9. **My Reports** – View uploaded files
10. **Directory** – Emergency contacts, doctors

---

## 🌐 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚨 Troubleshooting

### "Backend is Offline" Warning

**Cause:** Frontend opened as file:// (not via HTTP)

**Solution:** 
- Use `run-dev.sh` or `run-dev.bat`
- Or manually serve: `python3 -m http.server 8000`
- Visit `http://localhost:8000` (not `file://` URL)

### Backend won't start

**Check:**
```bash
cd backend
npm install
node backend.js  # See detailed error
```

### Files not uploading

**Check:**
1. Backend running: `curl http://localhost:3001/api/health`
2. Frontend shows "Backend: Online" (green)
3. Browser console for errors (F12)

### Port already in use

**Free port:**
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm start
```

---

## 📚 API Documentation

See `backend/README.md` for full API details.

---

## 🔐 Security Notes

**Local Development:**
- No authentication required
- Data stored in browser localStorage
- No encryption

**Production (Cloud):**
- Enable JWT authentication
- Use HTTPS only
- Set strong environment secrets
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for security checklist

---

## 📞 Support

For issues, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) – Cloud setup & troubleshooting
- `backend/README.md` – Backend API details
- `backend/DEPLOY_RENDER.md` – Render-specific notes

---

## 📄 License

This project is for MVP/educational purposes.

---

## 🎯 Next Steps

1. ✅ Local testing & backend running
2. ⬜ Add Sync Uploads feature (retry uploading locally saved files)
3. ⬜ Deploy to cloud (Render recommended)
4. ⬜ Integrate with real AI service
5. ⬜ Add database storage (MongoDB)
6. ⬜ User authentication (JWT)

---

**Made with ❤️ for senior care & healthcare accessibility.**
# Updated at Fri Dec  5 14:03:54 IST 2025
