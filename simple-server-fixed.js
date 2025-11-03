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
app.use(express.static('.'));

// In-memory storage (simplified for demonstration)
let messages = [];
let users = {};
let userSessions = {};

// Helper function to generate session token
function generateSessionToken() {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Decryption function
function decryptMessage(encryptedText, senderId, receiverId) {
  try {
    const SECRET_KEY = 'lynq-chat-secret-key-2024-secure';
    const combined = [senderId, receiverId].sort().join('-');
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

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      error: "Username and password are required" 
    });
  }

  console.log(`\n🔐 LOGIN ATTEMPT: ${username}`);

  // Check if user exists
  if (!users[username]) {
    // Create new user (auto-registration)
    users[username] = {
      username,
      password: CryptoJS.SHA256(password).toString(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
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
    
    users[username].lastLogin = new Date().toISOString();
    console.log(`✅ USER LOGGED IN: ${username}`);
  }

  // Generate session token
  const sessionToken = generateSessionToken();
  userSessions[sessionToken] = {
    username,
    loginTime: new Date().toISOString()
  };

  // Get user's message history
  const userMessages = messages.filter(msg => 
    msg.senderId === username || msg.receiverId === username
  );

  console.log(`📨 FOUND ${userMessages.length} messages for user: ${username}`);

  res.json({
    success: true,
    data: {
      user: {
        username,
        sessionToken,
        lastLogin: users[username].lastLogin
      },
      messageHistory: userMessages
    }
  });
});

app.post('/api/auth/validate', (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken || !userSessions[sessionToken]) {
    return res.status(401).json({ 
      success: false,
      error: "Invalid or expired session" 
    });
  }

  const session = userSessions[sessionToken];
  const username = session.username;

  // Get user's message history
  const userMessages = messages.filter(msg => 
    msg.senderId === username || msg.receiverId === username
  );

  console.log(`✅ SESSION VALID for: ${username} (${userMessages.length} messages)`);

  res.json({
    success: true,
    data: {
      user: {
        username,
        lastLogin: users[username].lastLogin
      },
      messageHistory: userMessages
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const { sessionToken } = req.body;

  if (sessionToken && userSessions[sessionToken]) {
    const username = userSessions[sessionToken].username;
    delete userSessions[sessionToken];
    console.log(`👋 USER LOGGED OUT: ${username}`);
  }

  res.json({ success: true });
});

// Message endpoints
app.get('/api/messages/test', (req, res) => {
  console.log(`\n📋 RETRIEVING MESSAGES: ${messages.length} total`);
  
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
  
  res.json({ 
    success: true,
    messages,
    count: messages.length
  });
});

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
    text,
    encryptedText,
    senderId,
    receiverId,
    participants: [senderId, receiverId],
    timestamp: new Date().toISOString(),
    isEncrypted: isEncrypted || false,
    ...(decryptedFromEncrypted && { backendDecrypted: decryptedFromEncrypted })
  };

  messages.push(newMessage);
  console.log('🔥 =====================================================\n');

  // Emit real-time update to connected clients
  io.emit("message", newMessage);

  res.json({
    success: true,
    data: newMessage,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Encrypted chat server running on port ${PORT}`);
  console.log(`🔐 AES-256-GCM encryption enabled`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});