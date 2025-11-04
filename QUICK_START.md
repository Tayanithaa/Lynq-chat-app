# 🚀 Quick Start Guide - Lynq Chat

## ⚡ Fast Setup (3 Minutes)

### Step 1: Start the Backend (30 seconds)
```powershell
cd c:\Users\Tayanithaa.N.S\lynq-chat
node simple-server.js
```

**Expected Output:**
```
🔥 Firebase Admin initialized successfully
� Encrypted chat server running on port 3004
🔐 AES-256-GCM encryption enabled
📍 Health check: http://localhost:3004/health
```

### Step 2: Verify Server (30 seconds)
```powershell
# In a new terminal
node test-server-health.js
```

**Expected:**
```
✅ Health Check: { status: 'OK', ... }
✅ Online Users: { success: true, data: { users: [] } }
```

### Step 3: Start the App (1 minute)
```powershell
npx expo start
```

Press `w` for web or scan QR code for mobile.

### Step 4: Test with Two Users (1 minute)

#### First Device/Browser:
1. Open app → Login as **"alice"** (any password)
2. Go to **Online** tab
3. Wait for bob to appear

#### Second Device/Browser:
1. Open app → Login as **"bob"** (any password)  
2. See **alice** in Online tab
3. Tap **alice** → Start chatting!

**Both devices will see messages instantly!** ⚡

---

## 🧪 Run Demos

### Demo 1: Automated Two-User Chat
```powershell
node demo-two-user-chat.js
```

Watch Alice and Bob have a conversation with realtime delivery!

### Demo 2: Full System Test
```powershell
node test-realtime-flow.js
```

Tests all features: presence, messaging, disconnect handling.

---

## 📱 For Phone Testing

### Find Your Computer's IP
```powershell
ipconfig
```
Look for **IPv4 Address** under your WiFi adapter (e.g., `192.168.1.100`)

### Update .env File
Create/edit `c:\Users\Tayanithaa.N.S\lynq-chat\.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3004
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:3004
```

Replace `192.168.1.100` with **your actual IP**.

### Restart Expo
```powershell
# Stop current expo (Ctrl+C)
npx expo start
```

Now scan QR code from your phone!

---

## ✅ What's Working

- ✅ Real user authentication (no default users)
- ✅ Instant message delivery via Socket.IO
- ✅ Online presence tracking
- ✅ Works between multiple devices
- ✅ End-to-end encryption support
- ✅ Clean, production-ready code

---

## 🐛 Troubleshooting

### Server won't start - "Port already in use"
```powershell
# Find process on port 3004
netstat -ano | findstr :3004

# Kill it (replace PID with the number from above)
taskkill /F /PID <PID>

# Restart server
node simple-server.js
```

### App can't connect to server
1. Check server is running: `http://localhost:3004/health` in browser
2. For phone: Ensure .env has correct IP
3. Ensure phone and computer on same WiFi network
4. Check firewall allows port 3004

### Messages not appearing instantly
1. Check Socket.IO connection in app logs
2. Verify both users are logged in
3. Try refreshing the chat screen

---

## 📚 More Info

- **Full Status**: See `IMPLEMENTATION_COMPLETE.md`
- **Features**: See `REALTIME_CHAT_STATUS.md`
- **Tests**: Run any `test-*.js` or `demo-*.js` script

---

## 🎯 Success Checklist

After following this guide, you should see:

- [x] Server running on port 3004
- [x] Health check passing
- [x] Two users can log in
- [x] Users see each other in Online tab
- [x] Messages appear instantly
- [x] Online status updates in real-time

**All done? You're ready to chat!** 💬

---

**Need help?** Check `IMPLEMENTATION_COMPLETE.md` for detailed technical info.
