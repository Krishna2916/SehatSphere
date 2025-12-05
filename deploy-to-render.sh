#!/bin/bash

# SehatSphere Render Deployment Helper
# This script guides you through deploying to Render

echo "🚀 SehatSphere Render Deployment Assistant"
echo ""
echo "=========================================="
echo "STEP 1: MongoDB Atlas Setup"
echo "=========================================="
echo ""
echo "✅ You should have completed this:"
echo "   1. Created MongoDB Atlas account"
echo "   2. Created free cluster"
echo "   3. Got connection string"
echo "   4. Added network access: 0.0.0.0/0"
echo ""
echo "Your MongoDB Connection String should look like:"
echo "mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/sehatdb"
echo ""
read -p "Paste your MongoDB connection string here: " MONGO_URI

if [ -z "$MONGO_URI" ]; then
  echo "❌ MongoDB URI is required"
  exit 1
fi

echo ""
echo "=========================================="
echo "STEP 2: Generate JWT Secret"
echo "=========================================="
echo ""

JWT_SECRET=$(openssl rand -hex 32)
echo "Generated JWT Secret (copy for later):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$JWT_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "=========================================="
echo "STEP 3: Render Deployment Instructions"
echo "=========================================="
echo ""
echo "Follow these steps to deploy on Render:"
echo ""
echo "1. Go to: https://render.com"
echo "2. Sign up with GitHub (easiest)"
echo "3. Click 'Dashboard' → 'New +' → 'Web Service'"
echo "4. Connect your GitHub:"
echo "   - Click 'Connect account'"
echo "   - Select: Krishna2916/SehatSphere"
echo ""
echo "5. Configure the service:"
echo "   - Name: sehatsphere-backend"
echo "   - Region: Singapore or nearest to you"
echo "   - Branch: main"
echo "   - Runtime: Node"
echo "   - Build Command: cd backend && npm install"
echo "   - Start Command: cd backend && npm start"
echo ""
echo "6. Add Environment Variables:"
echo "   Click 'Add Environment Variables' and add:"
echo ""
echo "   ┌─────────────────────────────────────┐"
echo "   │ PORT = 3001                         │"
echo "   │ NODE_ENV = production               │"
echo "   │                                     │"
echo "   │ JWT_SECRET =                        │"
echo "   │ $JWT_SECRET │"
echo "   │                                     │"
echo "   │ MONGODB_URI =                       │"
echo "   │ $MONGO_URI │"
echo "   └─────────────────────────────────────┘"
echo ""
echo "7. Click 'Create Web Service'"
echo "8. Wait 2-3 minutes for deployment"
echo ""
echo "9. Once deployed, you'll see:"
echo "   https://sehatsphere-backend-xxxx.onrender.com"
echo ""
echo "=========================================="
echo "STEP 4: Update Frontend Config"
echo "=========================================="
echo ""
read -p "Enter your Render backend URL (e.g., https://sehatsphere-backend-xxxx.onrender.com): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
  echo "❌ Backend URL is required"
  exit 1
fi

# Update config.js
cat > /Users/krishna/Desktop/SehatSphere/config.js << EOF
// Production Backend URL (Render)
const API_BASE_URL = "$BACKEND_URL/api";

export default API_BASE_URL;
EOF

echo "✅ Updated config.js with: $BACKEND_URL/api"

echo ""
echo "=========================================="
echo "STEP 5: Push to GitHub (Auto-Deploy)"
echo "=========================================="
echo ""
echo "Run these commands:"
echo ""
echo "cd ~/Desktop/SehatSphere"
echo "git add config.js"
echo "git commit -m 'Update API URL for production on Render'"
echo "git push origin main"
echo ""
echo "GitHub Pages will auto-update with the new backend URL!"
echo ""
echo "=========================================="
echo "STEP 6: Verify Deployment"
echo "=========================================="
echo ""
echo "1. Wait 30 seconds for GitHub Pages to update"
echo "2. Visit: https://krishna2916.github.io/SehatSphere/"
echo "3. Check header → Should show 'Backend: Online' ✅ (green)"
echo "4. Try logging in and uploading a file"
echo ""
echo "=========================================="
echo "✨ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your app is now live at:"
echo "Frontend: https://krishna2916.github.io/SehatSphere/"
echo "Backend:  $BACKEND_URL"
echo ""
