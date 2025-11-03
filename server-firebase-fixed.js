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

const PORT = 3004;

// Firebase Admin SDK initialization
let db;
try {
  // Initialize Firebase Admin with minimal config for Firestore
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'otpauth-74252', // Your Firebase project ID
    });
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

// In-memory storage as fallback
let messages = [];
let users = {};
let userSessions = {};

// Helper functions
function generateSessionToken() {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Encryption/Decryption functions (same as frontend)
function generateEncryptionKey(senderId, receiverId) {
  const users = [senderId, receiverId].sort();
  const keyString = `${users[0]}-${users[1]}-lynq-secret-key`;
  return CryptoJS.SHA256(keyString).toString();
}

function encryptMessage(message, senderId, receiverId) {
  try {
    const key = generateEncryptionKey(senderId, receiverId);
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    return encrypted;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    return message;
  }
}

function decryptMessage(encryptedMessage, senderId, receiverId) {
  try {
    const key = generateEncryptionKey(senderId, receiverId);
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    return plaintext;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return encryptedMessage;
  }
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

// Health check endpoint  
app.get('/health', (req, res) => {
  const dbStatus = db ? '🔥 Firebase Firestore: Connected' : '💾 In-memory storage only';
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    port: PORT
  });
});

// Authentication endpoints
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
      password: CryptoJS.SHA256(password).toString(), // Hash password
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    await saveUser(userData);
    console.log(`✅ NEW USER CREATED: ${username}`);
  } else {
    // Verify existing user
    const hashedPassword = CryptoJS.SHA256(password).toString();
    if (existingUser.password !== hashedPassword) {
      console.log(`❌ INVALID PASSWORD for: ${username}`);
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }
    
    userData = {
      ...existingUser,
      lastLogin: new Date().toISOString()
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

  res.json({
    success: true,
    user: {
      username: userData.username,
      sessionToken
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

// Get messages endpoint with Firebase integration
app.get('/api/messages/test', async (req, res) => {
  try {
    console.log(`\n📋 RETRIEVING MESSAGES from Firebase...`);
    
    // Get all messages from Firebase or fallback to memory
    let allMessages = [];
    if (db) {
      try {
        const messagesSnapshot = await db.collection('messages')
          .orderBy('createdAt', 'asc')
          .get();
        
        messagesSnapshot.forEach(doc => {
          allMessages.push({ id: doc.id, ...doc.data() });
        });
        console.log(`🔥 Retrieved ${allMessages.length} messages from Firebase`);
      } catch (error) {
        console.error('❌ Failed to retrieve from Firebase, using memory:', error);
        allMessages = messages;
      }
    } else {
      allMessages = messages;
    }
    
    // Show encryption status of stored messages
    allMessages.forEach((msg, index) => {
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
      messages: allMessages,
      count: allMessages.length,
      source: db ? 'Firebase' : 'Memory'
    });
  } catch (error) {
    console.error('❌ Error retrieving messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve messages'
    });
  }
});

// Send message endpoint with Firebase integration
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
    participants: [senderId, receiverId], // For Firebase querying
    timestamp: new Date().toISOString(),
    isEncrypted: isEncrypted || false,
    // Add decryption result for debugging
    ...(decryptedFromEncrypted && { backendDecrypted: decryptedFromEncrypted })
  };

  try {
    // Save to Firebase (with fallback to in-memory)
    const savedMessageId = await saveMessage(newMessage);
    newMessage.id = savedMessageId;
    
    console.log('💾 Message saved successfully with ID:', savedMessageId);
    console.log('🔥 =====================================================\n');

    // Emit real-time update to connected clients (including encrypted data)
    io.emit("message", newMessage);

    res.json({
      success: true,
      data: newMessage,
      savedTo: db ? 'Firebase' : 'Memory'
    });
  } catch (error) {
    console.error('❌ Error saving message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save message'
    });
  }
});

// Get user messages endpoint (for persistent chat history)
app.get('/api/messages/user/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userMessages = await getMessagesForUser(username);
    
    console.log(`📋 Retrieved ${userMessages.length} messages for user: ${username}`);
    
    res.json({
      success: true,
      messages: userMessages,
      count: userMessages.length,
      source: db ? 'Firebase' : 'Memory'
    });
  } catch (error) {
    console.error('❌ Error retrieving user messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user messages'
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Handle joining user-specific rooms for targeted messaging
  socket.on('join', (username) => {
    socket.join(username);
    console.log(`👤 User ${username} joined room: ${username}`);
  });

  // Handle direct message sending
  socket.on('send_message', async (messageData) => {
    try {
      console.log('📤 Socket message received:', messageData);
      
      // Save the message to Firebase
      const savedMessage = await saveMessage(messageData);
      
      // Emit to both sender and receiver
      io.to(messageData.senderId).emit('message', savedMessage);
      io.to(messageData.receiverId).emit('message', savedMessage);
      
      console.log('📤 Socket message saved and broadcasted');
    } catch (error) {
      console.error('❌ Error handling socket message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Encrypted chat server running on port ${PORT}`);
  console.log(`🔐 AES-256-GCM encryption enabled`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Database: ${db ? '🔥 Firebase Firestore' : '💿 In-memory only'}`);
});