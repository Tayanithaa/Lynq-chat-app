# 🚀 Lynq Chat App - Complete Development Guide

## ✅ Setup Status

### ✅ Backend
- **Location**: `backend/`
- **Port**: 3004
- **Health Check**: http://localhost:3004/health
- **API**: http://localhost:3004/api/
- **Technology**: Node.js + Express + TypeScript + Socket.io

### ✅ Frontend  
- **Location**: `app/`
- **Port**: 8081 (web), QR code (mobile)
- **Technology**: React Native + Expo Router + TypeScript
- **URL**: http://localhost:8081

### ✅ Real-time Features
- Socket.io for instant messaging
- Cross-platform support (web + mobile)
- Firebase integration (optional)

---

## 🚀 Quick Start

### Method 1: Automated Setup
```bash
# Run the complete setup script
start-complete-app.bat
```

### Method 2: Manual Setup

**Start Backend:**
```bash
cd backend
npm install
npm run build
npm start
```

**Start Frontend:**
```bash
npm install
npm start
```

---

## 📁 Project Structure

```
lynq-chat/
├── app/                      # Frontend (React Native + Expo)
│   ├── _layout.tsx          # Main app layout (AuthProvider)
│   ├── index.tsx            # Welcome screen
│   ├── front.tsx            # Main tabs (Chats, Updates, Calls)
│   ├── chatscreen.tsx       # Chat list screen
│   ├── callsscreen.tsx      # Calls screen
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── services/
│   │   ├── apiService.ts    # API communication
│   │   └── callingService.ts # Video calling
│   ├── hooks/
│   │   └── useMessages.ts   # Real-time messaging hook
│   └── utils/
│       └── socketConfig.ts  # Socket configuration
├── backend/                  # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.ts         # Main server file
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # External services
│   │   └── socket/          # Socket.io handlers
│   └── dist/                # Compiled JavaScript
└── assets/                  # Images and fonts
```

---

## 🔧 Key Features

### ✅ Authentication
- Firebase Auth integration
- Development mode fallback
- JWT token management

### ✅ Real-time Messaging
- Socket.io implementation
- Cross-platform messaging
- Message persistence

### ✅ Navigation
- Expo Router setup
- Tab navigation
- Screen transitions

### ✅ API Integration
- RESTful API design
- Real-time updates
- Error handling

---

## 🧪 Testing

### Health Check
```bash
# Test backend health
curl http://localhost:3004/health

# Or open in browser
http://localhost:3004/health
```

### Real-time Messaging Test
```bash
# Run automated test
node test-connectivity.js

# Manual test
# 1. Open http://localhost:8081
# 2. Navigate to Chat screen
# 3. Send messages
# 4. Open second browser tab
# 5. See real-time updates
```

### Mobile Testing
1. Install Expo Go app
2. Scan QR code from terminal
3. Test on mobile device

---

## 🔍 Troubleshooting

### Backend Not Starting
```bash
cd backend
npm install
npm run build
npm start
```

### Frontend Not Loading
```bash
npm install
npx expo install --fix
npm start
```

### Socket Connection Issues
- Check backend is running on port 3004
- Verify frontend can reach backend
- Check firewall settings

### Firebase Errors
- Firebase is disabled by default for development
- Check `.env` files for configuration

---

## 🌐 URLs

- **Frontend Web**: http://localhost:8081
- **Backend API**: http://localhost:3004
- **Health Check**: http://localhost:3004/health
- **API Docs**: http://localhost:3004/api

---

## 📝 Development Notes

### Environment Variables
- Frontend: `.env` (EXPO_PUBLIC_* variables)
- Backend: `backend/.env` (PORT, NODE_ENV, etc.)

### Code Structure
- TypeScript throughout
- Modular architecture
- Error handling included
- Development logging

### Real-time Architecture
```
Frontend (React Native) 
    ↕ Socket.io
Backend (Node.js + Express)
    ↕ API Calls
Database (Firebase/Local storage)
```

---

## 🎯 Next Steps

1. **Customize UI**: Modify styles in app components
2. **Add Features**: Extend API and frontend functionality  
3. **Deploy**: Configure for production deployment
4. **Testing**: Add comprehensive test suites

---

*Last updated: October 8, 2025*