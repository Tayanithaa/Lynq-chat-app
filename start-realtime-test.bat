@echo off
echo 🚀 Starting Lynq Chat App - Real-Time Messaging Test
echo.
echo Step 1: Starting Backend Server...
cd /d "c:\Users\Tayanithaa.N.S\lynq-chat\backend"
start "Backend Server" cmd /k "npx ts-node src\index.ts"

echo Step 2: Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Step 3: Starting Frontend (Expo)...
cd /d "c:\Users\Tayanithaa.N.S\lynq-chat\basic-rn"
start "Frontend Expo" cmd /k "npm start"

echo.
echo ✅ Both servers starting!
echo.
echo 📱 To test real-time messaging:
echo 1. Scan QR code with Expo Go app on your phone
echo 2. Open the chat screen in your app
echo 3. Send a message
echo 4. Open the app on another device (or web browser)
echo 5. Watch messages appear instantly on both devices!
echo.
echo 🔥 Firebase Firestore will store all messages permanently
echo ⚡ Socket.IO provides instant real-time updates
echo.
pause