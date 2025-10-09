@echo off
title Lynq Chat App - Complete Setup

echo 🚀 Starting Lynq Chat App - Complete Setup
echo ==========================================
echo.

echo 📋 Step 1: Checking dependencies...
cd /d "c:\Users\Tayanithaa.N.S\lynq-chat\backend"
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo 📋 Step 2: Building backend...
call npm run build

echo.
echo 📋 Step 3: Starting Backend Server...
start "Lynq Backend Server" cmd /k "echo 🚀 Backend Server Starting... && node dist/index.js"

echo.
echo 📋 Step 4: Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo 📋 Step 5: Starting Frontend (Expo)...
cd /d "c:\Users\Tayanithaa.N.S\lynq-chat"
start "Lynq Frontend (Expo)" cmd /k "echo 🚀 Frontend Starting... && npm start"

echo.
echo 📋 Step 6: Waiting for frontend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ✅ Setup Complete! 
echo ==========================================
echo.
echo 🌐 Frontend: http://localhost:8081
echo 🔧 Backend API: http://localhost:3004
echo 💚 Health Check: http://localhost:3004/health
echo.
echo 📱 To test real-time messaging:
echo    1. Open http://localhost:8081 in your browser
echo    2. Navigate to the Chat screen
echo    3. Send a message
echo    4. Open another browser tab and see real-time updates!
echo.
echo 🔧 Logs will appear in the separate terminal windows
echo.
pause