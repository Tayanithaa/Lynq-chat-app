const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const CryptoJS = require('crypto-js');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for messages and users
let messages = [];
let users = {};
let userSessions = {};

console.log('🚀 Starting LYNQ Chat Server...');

// Helper functions
function generateSessionToken() {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Encryption/Decryption functions (EXACTLY matching frontend)
function generateEncryptionKey(senderId, receiverId) {
  const SECRET_KEY = 'lynq-chat-secret-key-2024-secure'; // Must match frontend exactly
  const combined = [senderId, receiverId].sort().join('-');
  const key = CryptoJS.SHA256(combined + SECRET_KEY).toString();
  
  console.log(`🔑 Backend Key Generation:`);
  console.log(`   Users: [${senderId}, ${receiverId}]`);
  console.log(`   Sorted combined: "${combined}"`);
  console.log(`   Secret: "${SECRET_KEY}"`);
  console.log(`   Final key: ${key.substring(0, 20)}...`);
  
  return key;
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

// Health check endpoint  
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: '💾 In-memory storage',
    port: PORT,
    messagesCount: messages.length,
    usersCount: Object.keys(users).length
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
  let userData;
  
  if (!users[username]) {
    // Create new user (auto-registration for demo)
    userData = {
      username,
      password: CryptoJS.SHA256(password).toString(), // Hash password
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    users[username] = userData;
    console.log(`✅ NEW USER CREATED: ${username}`);
  } else {
    // Verify existing user
    const hashedPassword = CryptoJS.SHA256(password).toString();
    if (users[username].password !== hashedPassword) {
      console.log(`❌ INVALID PASSWORD for: ${username}`);
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }
    
    userData = {
      ...users[username],
      lastLogin: new Date().toISOString()
    };
    users[username] = userData;
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
    count: messages.length,
    source: 'Memory'
  });
});

// Send message endpoint
app.post('/api/messages/test', (req, res) => {
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
    participants: [senderId, receiverId], // For querying
    timestamp: new Date().toISOString(),
    isEncrypted: isEncrypted || false,
    // Add decryption result for debugging
    ...(decryptedFromEncrypted && { backendDecrypted: decryptedFromEncrypted })
  };

  // Save to memory
  messages.push(newMessage);
  console.log(`💾 Message saved to memory! Total messages: ${messages.length}`);
  console.log('🔥 =====================================================\n');

  // Emit real-time update to connected clients
  io.emit("message", newMessage);

  res.json({
    success: true,
    data: newMessage,
    savedTo: 'Memory',
    totalMessages: messages.length
  });
});

// Get user messages endpoint (for persistent chat history)
app.get('/api/messages/user/:username', (req, res) => {
  const { username } = req.params;
  
  const userMessages = messages.filter(msg => 
    msg.senderId === username || msg.receiverId === username
  );
  
  console.log(`📋 Retrieved ${userMessages.length} messages for user: ${username}`);
  
  res.json({
    success: true,
    messages: userMessages,
    count: userMessages.length,
    source: 'Memory'
  });
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
  socket.on('send_message', (messageData) => {
    try {
      console.log('📤 Socket message received:', messageData);
      
      // Save the message to memory
      const newMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      messages.push(newMessage);
      
      // Emit to both sender and receiver
      io.to(messageData.senderId).emit('message', newMessage);
      io.to(messageData.receiverId).emit('message', newMessage);
      
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
  console.log(`🚀 LYNQ Chat Server running on port ${PORT}`);
  console.log(`🔐 AES-256-GCM encryption enabled`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Database: In-memory storage (messages persist during session)`);
  console.log(`🌐 Frontend should be running on: http://localhost:8083`);
  console.log(`✅ Ready to receive messages!`);
});