const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const CryptoJS = require('crypto-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { Buffer } = require('buffer');

const APP_SECRET = process.env.APP_SECRET || 'lynq-dev-secret-2025-change-in-production';
const PORT = process.env.PORT || 3004;

// Initialize Firebase Admin (optional)
// Prefer local service account file (`./server/serviceAccountKey.json`) or
// a base64-encoded JSON in FIREBASE_SERVICE_ACCOUNT_BASE64. Fall back to
// in-memory storage when credentials are not available or initialization fails.
let db = null;
let useFirebase = false;

try {
  let serviceAccount = null;

  // 1) Check for base64-encoded service account in env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } catch (_e) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 present but failed to parse JSON:', _e && _e.message ? _e.message : _e);
    }
  }

  // 2) Fallback to local file if present
  if (!serviceAccount) {
    try {
      serviceAccount = require('./server/serviceAccountKey.json');
    } catch (_e) {
      // file not found or invalid
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    useFirebase = true;
    console.log('🔥 Firebase Admin initialized successfully (Firestore enabled)');
  } else {
    console.log('⚠️  No Firebase credentials found - running without Firebase (in-memory stores)');
    useFirebase = false;
  }
} catch (err) {
  console.error('❌ Firebase Admin initialization failed:', err && err.message ? err.message : err);
  useFirebase = false;
}

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

// In-memory fallback stores
const users = {};     // { username: { username, passwordHash, createdAt, displayName } }
const messages = [];  // { id, senderId, receiverId, text, encryptedText, isEncrypted, timestamp }

console.log('🚀 LYNQ Auth Server Starting...');
console.log('🔐 JWT Authentication Enabled');

// JWT token generation
function generateToken(username) {
  return jwt.sign({ username }, APP_SECRET, { expiresIn: '7d' });
}

// Authentication middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid token' });
  }
  
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, APP_SECRET);
    req.user = payload; // { username }
    next();
  } catch (err) {
    console.log('❌ Invalid token:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Encryption helpers (matching frontend exactly)
function generateEncryptionKey(senderId, receiverId) {
  const SECRET_KEY = 'lynq-chat-secret-key-2024-secure';
  const combined = [senderId, receiverId].sort().join('-');
  return CryptoJS.SHA256(combined + SECRET_KEY).toString();
}

function decryptMessage(encryptedText, senderId, receiverId) {
  try {
    const key = generateEncryptionKey(senderId, receiverId);
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || '[DECRYPTION_FAILED]';
  } catch (_e) {
    return '[DECRYPTION_FAILED]';
  }
}

// PUBLIC ENDPOINTS (No auth required)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    users: Object.keys(users).length,
    messages: messages.length,
    timestamp: new Date().toISOString()
  });
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName } = req.body;
  const uname = (username || '').toString().trim().toLowerCase();
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }
  
  try {
    // Normalize username and check if user exists in Firebase (if available)
    // Use `uname` (trimmed/lowercase) as the canonical id
    if (!uname) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    if (useFirebase && db) {
      const userRef = db.collection('users').doc(uname);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        return res.status(409).json({ success: false, error: 'User already found' });
      }
    } else {
      // Check in-memory
      if (users[uname]) {
        return res.status(409).json({ success: false, error: 'User already found' });
      }
    }
    
    console.log(`👤 NEW USER REGISTRATION: ${username}`);
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userData = {
      username: uname,
      passwordHash,
      displayName: displayName || uname,
      createdAt: new Date().toISOString()
    };
    
    // Save to Firebase if available
    if (useFirebase && db) {
      const userRef = db.collection('users').doc(uname);
      await userRef.set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        loginCount: 1
      });
    }

    // Always save to in-memory under normalized key
  users[uname] = Object.assign({}, userData, { lastLogin: new Date().toISOString(), loginCount: 1 });
    
  const token = generateToken(uname);
    
    console.log(`✅ User registered successfully: ${username}`);
    
    res.json({
      success: true,
      data: {
        user: {
          uid: uname,
          username: uname,
          displayName: userData.displayName
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login existing user
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const uname = (username || '').toString().trim().toLowerCase();

  if (!uname || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  console.log(`🔐 LOGIN ATTEMPT: ${uname}`);
  
  try {
    let user;
    
    // Try to get user from Firebase first (if available)
    if (useFirebase && db) {
      const userRef = db.collection('users').doc(uname);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        user = userDoc.data();
        // Cache in memory under normalized key
        users[uname] = user;
      }
    }

    // Fallback to in-memory
    if (!user) {
      user = users[uname];
    }
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      console.log(`❌ Wrong password for: ${username}`);
      return res.status(401).json({ success: false, error: 'Wrong Password' });
    }
    
    console.log(`✅ LOGIN SUCCESS: ${username}`);
    
  const token = generateToken(uname);
    // Update lastLogin and loginCount in Firestore and in-memory
    try {
      if (useFirebase && db) {
        const userRef = db.collection('users').doc(uname);
        const currentCount = (user && user.loginCount) ? Number(user.loginCount) : 0;
        await userRef.set({ lastLogin: admin.firestore.FieldValue.serverTimestamp(), loginCount: currentCount + 1 }, { merge: true });
      }
    } catch (e) {
      console.warn('⚠️ Failed to update login metadata in Firestore:', e && e.message ? e.message : e);
    }

    // Update in-memory cache
    users[uname] = Object.assign({}, users[uname] || {}, { lastLogin: new Date().toISOString(), loginCount: (users[uname] && users[uname].loginCount) ? users[uname].loginCount + 1 : 1 });
    
    res.json({
      success: true,
      data: {
        user: {
          uid: uname,
          username: uname,
          displayName: user.displayName || uname
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Debug: check whether a user exists (safe — does not return password hash)
app.get('/api/debug/user/:username', async (req, res) => {
  const raw = req.params.username || '';
  const uname = raw.toString().trim().toLowerCase();

  try {
    let existsInFirestore = false;
    let existsInMemory = !!users[uname];
    let displayName = null;
    let createdAt = null;

    if (useFirebase && db) {
      const userRef = db.collection('users').doc(uname);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        existsInFirestore = true;
        const data = userDoc.data() || {};
        displayName = data.displayName || null;
        createdAt = data.createdAt || null;
      }
    }

    if (!displayName && existsInMemory) {
      displayName = users[uname].displayName || null;
      createdAt = users[uname].createdAt || null;
    }

    res.json({ success: true, data: { existsInFirestore, existsInMemory, displayName, createdAt } });
  } catch (err) {
    console.error('❌ Debug user check error:', err && err.message ? err.message : err);
    res.status(500).json({ success: false, error: 'Debug check failed' });
  }
});

// PROTECTED ENDPOINTS (Auth required)

// Validate token and get user info
app.post('/api/auth/validate', authMiddleware, async (req, res) => {
  const username = req.user.username;
  
  try {
    let user;
    
    // Try to get user from Firebase first (if available)
    if (useFirebase && db) {
      const userRef = db.collection('users').doc(username);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        user = userDoc.data();
      }
    }
    
    // Fallback to in-memory
    if (!user) {
      user = users[username];
    }
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          uid: username,
          username,
          displayName: user.displayName || username
        }
      }
    });
  } catch (error) {
    console.error('❌ Validate error:', error.message);
    res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

// Send message (protected)
app.post('/api/messages', authMiddleware, (req, res) => {
  const senderId = req.user.username;
  const { receiverId, text, encryptedText, isEncrypted } = req.body;
  
  if (!receiverId || (!text && !encryptedText)) {
    return res.status(400).json({ success: false, error: 'Missing receiverId or message text' });
  }
  
  // Verify receiver exists
  if (!users[receiverId]) {
    return res.status(404).json({ success: false, error: 'Receiver not found' });
  }
  
  console.log(`📨 NEW MESSAGE: ${senderId} → ${receiverId}`);
  
  const id = Date.now().toString();
  const msg = {
    id,
    senderId,
    receiverId,
    text: text || '',
    encryptedText: encryptedText || '',
    isEncrypted: !!isEncrypted,
    timestamp: new Date().toISOString()
  };
  
  // Optional: decrypt for logging
  if (isEncrypted && encryptedText) {
    const decrypted = decryptMessage(encryptedText, senderId, receiverId);
    console.log(`   Encrypted: ${encryptedText.substring(0, 30)}...`);
    console.log(`   Decrypted: ${decrypted}`);
    console.log(`   Match: ${text === decrypted ? '✅' : '❌'}`);
  }
  
  messages.push(msg);
  
  // Broadcast to Socket.io
  io.emit('message', msg);
  
  res.json({ success: true, data: msg });
});

// Get conversation with another user (protected)
app.get('/api/messages/:otherUser', authMiddleware, (req, res) => {
  const me = req.user.username;
  const other = req.params.otherUser;
  
  const chatMessages = messages.filter(m =>
    (m.senderId === me && m.receiverId === other) ||
    (m.senderId === other && m.receiverId === me)
  );
  
  res.json({ success: true, data: chatMessages });
});

// Get all messages for current user (protected) - test endpoint
app.get('/api/messages/test', authMiddleware, (req, res) => {
  const username = req.user.username;
  const userMessages = messages.filter(m =>
    m.senderId === username || m.receiverId === username
  );
  
  res.json({
    success: true,
    messages: userMessages,
    count: userMessages.length
  });
});

// Legacy test endpoint without auth (for backwards compatibility during migration)
app.post('/api/messages/test', (req, res) => {
  const { text, senderId, receiverId, encryptedText, isEncrypted } = req.body;
  
  if (!text || !senderId || !receiverId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }
  
  console.log(`📨 LEGACY MESSAGE: ${senderId} → ${receiverId}`);
  
  const id = Date.now().toString();
  const msg = {
    id,
    senderId,
    receiverId,
    text,
    encryptedText: encryptedText || '',
    isEncrypted: !!isEncrypted,
    timestamp: new Date().toISOString()
  };
  
  messages.push(msg);
  io.emit('message', msg);
  
  res.json({ success: true, data: msg });
});

// Get list of all users (protected)
app.get('/api/users', authMiddleware, (req, res) => {
  const currentUser = req.user.username;
  const userList = Object.keys(users)
    .filter(u => u !== currentUser)
    .map(username => ({
      username,
      displayName: users[username].displayName
    }));
  
  res.json({ success: true, data: userList });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  
  socket.on('join', (username) => {
    socket.join(username);
    console.log(`👤 User ${username} joined room`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`✅ LYNQ Auth Server running on http://localhost:${PORT}`);
  console.log(`🔐 JWT Authentication enabled`);
  console.log(`🔒 AES-256 encryption active`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});
