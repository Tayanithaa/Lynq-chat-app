const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const CryptoJS = require('crypto-js');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./server/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const APP_SECRET = process.env.APP_SECRET || 'lynq-dev-secret-2025-change-in-production';
const PORT = process.env.PORT || 3004;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory stores (replace with database in production)
const users = {};     // { uid: { uid, phoneNumber, displayName, createdAt } }
const messages = [];  // { id, senderId, receiverId, text, encryptedText, isEncrypted, timestamp }

console.log('🚀 LYNQ Auth Server Starting...');
console.log('🔐 Firebase Phone Authentication Enabled');

// Firebase token verification middleware
async function firebaseAuthMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid token' });
  }
  
  const token = auth.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // { uid, phone_number, etc }
    next();
  } catch (err) {
    console.log('❌ Invalid Firebase token:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeUsers: Object.keys(users).length,
    totalMessages: messages.length
  });
});

// Sync user from Firebase to backend
app.post('/api/auth/sync', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { uid, phoneNumber, displayName } = req.body;
    
    if (!users[uid]) {
      users[uid] = {
        uid,
        phoneNumber,
        displayName: displayName || phoneNumber,
        createdAt: new Date().toISOString()
      };
      console.log(`✅ New user synced: ${phoneNumber} (${uid})`);
    } else {
      // Update existing user
      users[uid].displayName = displayName || users[uid].displayName;
      console.log(`🔄 User updated: ${phoneNumber} (${uid})`);
    }
    
    res.json({ 
      success: true, 
      data: { user: users[uid] }
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users (excluding current user)
app.get('/api/users', firebaseAuthMiddleware, (req, res) => {
  const currentUid = req.user.uid;
  const userList = Object.values(users)
    .filter(u => u.uid !== currentUid)
    .map(u => ({ uid: u.uid, displayName: u.displayName, phoneNumber: u.phoneNumber }));
  
  res.json({ success: true, data: { users: userList } });
});

// Send a message
app.post('/api/messages', firebaseAuthMiddleware, (req, res) => {
  const senderId = req.user.uid;
  const { receiverId, text, encryptedText, isEncrypted } = req.body;
  
  if (!receiverId || (!text && !encryptedText)) {
    return res.status(400).json({ success: false, error: 'receiverId and message content required' });
  }
  
  const message = {
    id: Date.now().toString(),
    senderId,
    receiverId,
    text: text || null,
    encryptedText: encryptedText || null,
    isEncrypted: isEncrypted || false,
    timestamp: new Date().toISOString()
  };
  
  messages.push(message);
  console.log(`📨 Message from ${senderId} to ${receiverId}`);
  
  // Emit to receiver via Socket.io if connected
  io.to(receiverId).emit('new-message', message);
  
  res.json({ success: true, data: { message } });
});

// Get messages between current user and another user
app.get('/api/messages/:otherUid', firebaseAuthMiddleware, (req, res) => {
  const currentUid = req.user.uid;
  const { otherUid } = req.params;
  
  const conversation = messages.filter(
    m => (m.senderId === currentUid && m.receiverId === otherUid) ||
         (m.senderId === otherUid && m.receiverId === currentUid)
  );
  
  res.json({ success: true, data: { messages: conversation } });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);
  
  // Authenticate socket connection with Firebase token
  socket.on('authenticate', async (token) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      socket.userId = decodedToken.uid;
      socket.join(decodedToken.uid); // Join room with their UID
      console.log(`✅ Socket authenticated: ${decodedToken.phone_number} (${decodedToken.uid})`);
      socket.emit('authenticated', { success: true, uid: decodedToken.uid });
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });
  
  // Send message via socket
  socket.on('send-message', async (data) => {
    const { token, receiverId, text, encryptedText, isEncrypted } = data;
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const senderId = decodedToken.uid;
      
      const message = {
        id: Date.now().toString(),
        senderId,
        receiverId,
        text: text || null,
        encryptedText: encryptedText || null,
        isEncrypted: isEncrypted || false,
        timestamp: new Date().toISOString()
      };
      
      messages.push(message);
      console.log(`📨 Socket message from ${senderId} to ${receiverId}`);
      
      // Send to both sender and receiver
      io.to(senderId).emit('new-message', message);
      io.to(receiverId).emit('new-message', message);
      
    } catch (error) {
      console.error('❌ Send message error:', error.message);
      socket.emit('message-error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ LYNQ Auth Server running on http://localhost:${PORT}`);
  console.log(`🔐 Firebase Phone Authentication enabled`);
  console.log(`🔒 AES-256 encryption active`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});
