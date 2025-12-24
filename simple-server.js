const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const CryptoJS = require('crypto-js');
const admin = require('firebase-admin');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


const PORT = process.env.PORT || 3004;

// Firebase Admin SDK initialization
const fs = require('fs');
const path = require('path');
let db;
try {
  // Prefer an explicit service account file if present in the project
  const candidatePaths = [
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, 'server', 'serviceAccountKey.json')
  ];
  const found = candidatePaths.find(p => fs.existsSync(p));

  if (found) {
    const serviceAccount = require(found);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'otpauth-74252'
      });
    }
    console.log(`🔥 Firebase Admin initialized using service account: ${found}`);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // If the environment variable is set, let the client library pick it up.
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'otpauth-74252' });
    }
    console.log('🔥 Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
  } else {
    // No credentials available — fall back to in-memory mode
    throw new Error('No Firebase credentials found (service account file or GOOGLE_APPLICATION_CREDENTIALS)');
  }

  db = admin.firestore();
  console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('💡 Running in memory-only mode');
  db = null;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage (fallback when Firebase is not available)
let messages = [];
let users = {}; // Store user sessions and data
let userSessions = {}; // Track active sessions
// Online users presence map: username -> socketId
const onlineUsers = new Map();

// Helper function to generate session token
function generateSessionToken() {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Firebase storage functions
async function saveMessage(messageData) {
  if (db) {
    try {
      const docRef = await db.collection('messages').add({
        ...messageData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('💾 Message saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to save message to Firebase:', error);
      // Fallback to in-memory storage
      messages.push(messageData);
      return messageData.id;
    }
  } else {
    // Use in-memory storage
    messages.push(messageData);
    return messageData.id;
  }
}

async function getMessagesForUser(username) {
  if (db) {
    try {
      const messagesSnapshot = await db.collection('messages')
        .where('participants', 'array-contains', username)
        .orderBy('createdAt', 'asc')
        .get();
      
      const userMessages = [];
      messagesSnapshot.forEach(doc => {
        userMessages.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`🔥 Retrieved ${userMessages.length} messages for ${username} from Firebase`);
      return userMessages;
    } catch (error) {
      console.error('❌ Failed to retrieve messages from Firebase:', error);
      // Fallback to in-memory storage
      return messages.filter(msg => 
        msg.senderId === username || msg.receiverId === username
      );
    }
  } else {
    // Use in-memory storage
    return messages.filter(msg => 
      msg.senderId === username || msg.receiverId === username
    );
  }
}

async function saveUser(userData) {
  if (db) {
    try {
      await db.collection('users').doc(userData.username).set({
        ...userData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('💾 User saved to Firebase:', userData.username);
    } catch (error) {
      console.error('❌ Failed to save user to Firebase:', error);
      // Fallback to in-memory storage
      users[userData.username] = userData;
    }
  } else {
    // Use in-memory storage
    users[userData.username] = userData;
  }
}

async function getUser(username) {
  if (db) {
    try {
      const userDoc = await db.collection('users').doc(username).get();
      if (userDoc.exists) {
        console.log('🔥 Retrieved user from Firebase:', username);
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve user from Firebase:', error);
      // Fallback to in-memory storage
      return users[username] || null;
    }
  } else {
    // Use in-memory storage
    return users[username] || null;
  }
}

// Decryption function (matches your app's MessageEncryption.decrypt exactly)
function decryptMessage(encryptedText, senderId, receiverId) {
  try {
    // Match your app's key generation exactly: sort users + hash with SECRET_KEY
    const SECRET_KEY = 'lynq-chat-secret-key-2024-secure'; // Remove the dash prefix
  // Normalize the user ids to avoid mismatches from casing/whitespace.
  const a = (senderId || '').toString().trim().toLowerCase();
  const b = (receiverId || '').toString().trim().toLowerCase();
  const combined = [a, b].sort().join('-');
    const secretKey = CryptoJS.SHA256(combined + SECRET_KEY).toString();
    
    console.log(`🔑 Users: [${senderId}, ${receiverId}]`);
    console.log(`🔑 Sorted combined: "${combined}"`);
    console.log(`🔑 Final key (SHA256): ${secretKey.substring(0, 20)}...`);
    
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      console.log('⚠️ Decryption resulted in empty string - key mismatch!');
      return '[DECRYPTION_FAILED]';
    }
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error.message);
    return '[DECRYPTION_FAILED]';
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    messages: messages.length,
    users: Object.keys(users).length,
    encryption: 'AES-256 Enabled',
    timestamp: new Date().toISOString() 
  });
});

// User registration/login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      error: "Username and password are required" 
    });
  }

  console.log(`\n🔐 LOGIN ATTEMPT: ${username}`);

  // Check if user exists
  const existingUser = await getUser(username);
  let userData;
  
  if (!existingUser) {
    // Create new user (auto-registration for demo)
    userData = {
      username,
      // Minimal user metadata for demo
      lastLogin: new Date().toISOString(),
      displayName: username
    };
    await saveUser(userData);
    console.log(`✅ USER LOGGED IN: ${username}`);
  }

  // Generate session token
  const sessionToken = generateSessionToken();
  userSessions[sessionToken] = {
    username,
    loginTime: new Date().toISOString()
  };

  // Get user's message history from Firebase
  const userMessages = await getMessagesForUser(username);

  console.log(`📨 FOUND ${userMessages.length} messages for user: ${username}`);
  const responseUser = userData || existingUser || { username, lastLogin: new Date().toISOString() };

  res.json({
    success: true,
    data: {
      user: {
        username,
        sessionToken,
        lastLogin: responseUser.lastLogin
      },
      messageHistory: userMessages
    }
  });
});

// Session validation endpoint
app.post('/api/auth/validate', async (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken || !userSessions[sessionToken]) {
    return res.status(401).json({ 
      success: false,
      error: "Invalid or expired session" 
    });
  }

  const session = userSessions[sessionToken];
  const username = session.username;

  // Get user data and message history from Firebase
  const userData = await getUser(username);
  const userMessages = await getMessagesForUser(username);

  console.log(`✅ SESSION VALID for: ${username} (${userMessages.length} messages)`);

  res.json({
    success: true,
    data: {
      user: {
        username,
        lastLogin: userData?.lastLogin || new Date().toISOString()
      },
      messageHistory: userMessages
    }
  });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const { sessionToken } = req.body;

  if (sessionToken && userSessions[sessionToken]) {
    const username = userSessions[sessionToken].username;
    delete userSessions[sessionToken];
    console.log(`👋 USER LOGGED OUT: ${username}`);
  }

  res.json({ success: true });
});

// Online users endpoint (simple presence)
app.get('/api/users/online', (req, res) => {
  try {
    const list = Array.from(onlineUsers.keys());
    res.json({ success: true, data: { users: list } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get online users' });
  }
});

// Get messages endpoint
app.get('/api/messages/test', (req, res) => {
  console.log(`\n📋 RETRIEVING MESSAGES: ${messages.length} total`);
  
  // Show encryption status of stored messages
  messages.forEach((msg, index) => {
    console.log(`\n📨 Message ${index + 1}:`);
    console.log(`   ID: ${msg.id}`);
    console.log(`   From: ${msg.senderId} → To: ${msg.receiverId}`);
    console.log(`   Encrypted: ${msg.isEncrypted ? 'YES' : 'NO'}`);
    
    if (msg.isEncrypted && msg.encryptedText) {
      console.log(`   Original: "${msg.text}"`);
      console.log(`   Encrypted: "${msg.encryptedText.substring(0, 50)}..."`);
      
      // Try to decrypt
      const decrypted = decryptMessage(msg.encryptedText, msg.senderId, msg.receiverId);
      console.log(`   Backend Decrypted: "${decrypted}"`);
      console.log(`   Match: ${msg.text === decrypted ? '✅' : '❌'}`);
    } else {
      console.log(`   Text: "${msg.text}"`);
    }
  });
  
  res.json({ 
    success: true,
    messages,
    count: messages.length
  });
});

// Backward-compatible authenticated endpoints (mirror test endpoints)
// Some clients call /api/messages and /api/messages (POST). Provide the same
// behavior so older/newer clients both work during development.
app.get('/api/messages', (req, res) => {
  console.log('\n📋 RETRIEVING MESSAGES (auth endpoint)');
  try {
    // Reuse the same logic as the test endpoint
    messages.forEach((msg, index) => {
      console.log(`\n📨 Message ${index + 1}:`);
      console.log(`   ID: ${msg.id}`);
      console.log(`   From: ${msg.senderId} → To: ${msg.receiverId}`);
      console.log(`   Encrypted: ${msg.isEncrypted ? 'YES' : 'NO'}`);

      if (msg.isEncrypted && msg.encryptedText) {
        console.log(`   Original: "${msg.text}"`);
        console.log(`   Encrypted: "${msg.encryptedText.substring(0, 50)}..."`);
        const decrypted = decryptMessage(msg.encryptedText, msg.senderId, msg.receiverId);
        console.log(`   Backend Decrypted: "${decrypted}"`);
        console.log(`   Match: ${msg.text === decrypted ? '✅' : '❌'}`);
      } else {
        console.log(`   Text: "${msg.text}"`);
      }
    });

    res.json({ success: true, messages, count: messages.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve messages' });
  }
});

// Send message endpoint
app.post('/api/messages/test', async (req, res) => {
  const { text, senderId, receiverId, encryptedText, isEncrypted } = req.body;

  if (!text || !senderId || !receiverId) {
    return res.status(400).json({ 
      success: false,
      error: "Missing required fields: text, senderId, receiverId" 
    });
  }

  console.log('\n🔥 ==================== NEW MESSAGE ====================');
  console.log(`📨 Message ID: ${Date.now()}`);
  console.log(`👤 From: ${senderId}`);
  console.log(`👤 To: ${receiverId}`);
  console.log(`🔐 Is Encrypted: ${isEncrypted ? 'YES' : 'NO'}`);
  
  let decryptedFromEncrypted = null;
  
  if (isEncrypted && encryptedText) {
    console.log('\n📝 ORIGINAL PLAIN TEXT:');
    console.log(`"${text}"`);
    
    console.log('\n🔒 ENCRYPTED VERSION:');
    console.log(`"${encryptedText}"`);
    
    console.log('\n🔓 BACKEND DECRYPTION ATTEMPT:');
    decryptedFromEncrypted = decryptMessage(encryptedText, senderId, receiverId);
    console.log(`Decrypted Result: "${decryptedFromEncrypted}"`);
    
    console.log('\n✅ VERIFICATION:');
    console.log(`Original matches decrypted: ${text === decryptedFromEncrypted ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log('\n📝 PLAIN TEXT MESSAGE:');
    console.log(`"${text}"`);
  }

  const newMessage = {
    id: Date.now().toString(),
    text, // Plain text for server logging
    encryptedText, // Encrypted version for storage
    senderId,
    receiverId,
    timestamp: new Date().toISOString(),
    isEncrypted: isEncrypted || false,
    // Add decryption result for debugging
    ...(decryptedFromEncrypted && { backendDecrypted: decryptedFromEncrypted })
  };

  messages.push(newMessage);
  console.log('� =====================================================\n');

  // Emit real-time update to connected clients
  // 1) Backward-compatible global event for existing listeners
  io.emit("message", newMessage);
  // 2) Preferred targeted events: notify sender and receiver rooms if connected
  const senderSocketId = onlineUsers.get(senderId);
  const receiverSocketId = onlineUsers.get(receiverId);
  if (senderSocketId) io.to(senderSocketId).emit('new-message', newMessage);
  if (receiverSocketId) io.to(receiverSocketId).emit('new-message', newMessage);

  res.json({
    success: true,
    data: newMessage,
  });
});

// Backward-compatible POST endpoint for sending messages
app.post('/api/messages', async (req, res) => {
  const { text, senderId, receiverId, encryptedText, isEncrypted } = req.body;

  if (!text || !senderId || !receiverId) {
    return res.status(400).json({ 
      success: false,
      error: "Missing required fields: text, senderId, receiverId" 
    });
  }

  console.log('\n🔥 ==================== NEW MESSAGE (auth endpoint) ====================');
  console.log(`📨 Message ID: ${Date.now()}`);
  console.log(`👤 From: ${senderId}`);
  console.log(`👤 To: ${receiverId}`);
  console.log(`🔐 Is Encrypted: ${isEncrypted ? 'YES' : 'NO'}`);
  
  let decryptedFromEncrypted = null;
  
  if (isEncrypted && encryptedText) {
    console.log('\n📝 ORIGINAL PLAIN TEXT:');
    console.log(`"${text}"`);
    
    console.log('\n🔒 ENCRYPTED VERSION:');
    console.log(`"${encryptedText}"`);
    
    console.log('\n🔓 BACKEND DECRYPTION ATTEMPT:');
    decryptedFromEncrypted = decryptMessage(encryptedText, senderId, receiverId);
    console.log(`Decrypted Result: "${decryptedFromEncrypted}"`);
    
    console.log('\n✅ VERIFICATION:');
    console.log(`Original matches decrypted: ${text === decryptedFromEncrypted ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log('\n📝 PLAIN TEXT MESSAGE:');
    console.log(`"${text}"`);
  }

  const newMessage = {
    id: Date.now().toString(),
    text, // Plain text for server logging
    encryptedText, // Encrypted version for storage
    senderId,
    receiverId,
    timestamp: new Date().toISOString(),
    isEncrypted: isEncrypted || false,
    // Add decryption result for debugging
    ...(decryptedFromEncrypted && { backendDecrypted: decryptedFromEncrypted })
  };

  messages.push(newMessage);
  console.log('� =====================================================\n');

  // Emit real-time update to connected clients
  io.emit("message", newMessage);
  const senderSocketId = onlineUsers.get(senderId);
  const receiverSocketId = onlineUsers.get(receiverId);
  if (senderSocketId) io.to(senderSocketId).emit('new-message', newMessage);
  if (receiverSocketId) io.to(receiverSocketId).emit('new-message', newMessage);

  res.json({
    success: true,
    data: newMessage,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Client should emit 'join' with their app username after connecting
  socket.on('join', (username) => {
    if (!username || typeof username !== 'string') return;
    // Map username -> socket.id
    onlineUsers.set(username, socket.id);
    // Attach for disconnection cleanup
    socket.data = socket.data || {};
    socket.data.username = username;
    console.log(`✅ ${username} is online (${socket.id})`);
    // Broadcast updated online user list
    io.emit('users-online', Array.from(onlineUsers.keys()));
    io.emit('user-joined', { username });
  });

  socket.on('disconnect', () => {
    // Remove by socket id
    let removedUser = null;
    for (const [username, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(username);
        removedUser = username;
        break;
      }
    }
    if (removedUser) {
      console.log(`� ${removedUser} went offline (${socket.id})`);
      io.emit('users-online', Array.from(onlineUsers.keys()));
      io.emit('user-left', { username: removedUser });
    } else {
      console.log(`�👤 User disconnected: ${socket.id}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`� Encrypted chat server running on port ${PORT}`);
  console.log(`🔐 AES-256-GCM encryption enabled`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});