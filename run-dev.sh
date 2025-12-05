#!/bin/bash

# SehatSphere Local Development Server
# Starts both backend and frontend with proper HTTP serving

echo "🚀 Starting SehatSphere Development Environment..."

# Start backend on port 3001
echo "📡 Starting backend on http://localhost:3001..."
cd "$(dirname "$0")/backend"
npm start > /tmp/sehatsphere-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Start frontend on port 8000
echo "🌐 Starting frontend on http://localhost:8000..."
cd "$(dirname "$0")"
python3 -m http.server 8000 > /tmp/sehatsphere-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for servers to start
sleep 3

echo ""
echo "✅ SehatSphere is running!"
echo ""
echo "📱 Open your browser and go to: http://localhost:8000"
echo ""
echo "📡 Backend API: http://localhost:3001/api"
echo "   Health: http://localhost:3001/api/health"
echo ""
echo "🛑 To stop the servers, run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📊 View logs:"
echo "   Backend:  tail -f /tmp/sehatsphere-backend.log"
echo "   Frontend: tail -f /tmp/sehatsphere-frontend.log"
echo ""

# Keep script running
wait
