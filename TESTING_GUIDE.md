# 🧪 Testing Your Lynq Chat App

## ✅ Current Status

### Backend Server ✅
- **Status**: Running and healthy
- **Port**: 3004
- **Health Check**: http://localhost:3004/health
- **API Endpoint**: http://localhost:3004/api/messages/test
- **Socket.io**: Enhanced for mobile + web support

### Frontend App 🚀
- **Status**: Starting up (Metro bundler rebuilding)
- **Will be available at**: http://localhost:8081 (web)
- **Mobile**: QR code will appear for Expo Go scanning

## 🔍 How to Test Everything

### 1. **Backend API Testing** ✅
```bash
# Health check
curl http://localhost:3004/health

# Get messages
curl http://localhost:3004/api/messages/test

# Send a test message
curl -X POST http://localhost:3004/api/messages/test -H "Content-Type: application/json" -d '{"senderId":"test-user","receiverId":"another-user","text":"Hello from API test!"}'
```

### 2. **Web App Testing** (Once Metro finishes)
1. Wait for Metro bundler to finish (showing QR code)
2. Open: http://localhost:8081
3. Test the chat interface
4. Check browser console for socket connection logs

### 3. **Mobile App Testing**
1. Install Expo Go app on your phone
2. Scan the QR code that will appear
3. Test real-time messaging
4. Socket will auto-connect to your computer's IP

### 4. **Socket Connection Testing**
Watch for these console logs in your app:
- `🔌 Setting up socket connection to: [URL]`
- `🔌 Socket connected: [socket-id]`
- Real-time message updates

### 5. **Cross-Platform Testing**
1. Open web app (http://localhost:8081)
2. Open mobile app (scan QR code)
3. Send messages from web → should appear on mobile instantly
4. Send messages from mobile → should appear on web instantly

## 🐛 What to Look For

### ✅ Working Signs:
- Backend health check returns JSON
- Frontend loads without errors
- Socket connects (check console logs)
- Messages sync in real-time
- No CORS errors

### ⚠️ Warning Signs:
- Socket connection errors
- Messages not syncing
- API calls failing
- CORS blocking requests

## 📊 Test Checklist

- [ ] Backend health check works
- [ ] API endpoints respond
- [ ] Frontend loads successfully
- [ ] Socket connects on web
- [ ] Socket connects on mobile
- [ ] Real-time messaging works
- [ ] Cross-platform sync works

## 🔧 Quick Fixes

If you encounter issues:

1. **Backend not responding**: Check if port 3004 is free
2. **Frontend won't start**: Clear Metro cache with `--clear`
3. **Socket won't connect**: Check firewall settings
4. **Mobile can't connect**: Ensure phone and computer on same network

## 📱 Next Steps

Once everything is working:
1. Test sending messages between web and mobile
2. Check real-time synchronization
3. Test with multiple devices
4. Verify message persistence

Your app should now be fully functional for both web and mobile! 🎉