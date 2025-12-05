@echo off
REM SehatSphere Local Development Server (Windows)
REM Starts both backend and frontend with proper HTTP serving

echo.
echo 🚀 Starting SehatSphere Development Environment...
echo.

REM Start backend on port 3001
echo 📡 Starting backend on http://localhost:3001...
cd backend
start "SehatSphere Backend" cmd /k npm start
timeout /t 2 /nobreak

REM Start frontend on port 8000
echo 🌐 Starting frontend on http://localhost:8000...
cd ..
start "SehatSphere Frontend" cmd /k python -m http.server 8000

echo.
echo ✅ SehatSphere is running!
echo.
echo 📱 Open your browser and go to: http://localhost:8000
echo.
echo 📡 Backend API: http://localhost:3001/api
echo    Health: http://localhost:3001/api/health
echo.
echo 🛑 Close the command windows above to stop the servers
echo.
pause
