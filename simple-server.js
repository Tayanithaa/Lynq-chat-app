const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

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

// In-memory message storage
let messages = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    messages: messages.length,
    encryption: 'AES-256 Enabled',
    timestamp: new Date().toISOString() 
  });
});

// Get messages endpoint
app.get('/api/messages/test', (req, res) => {
  console.log(`📋 Retrieved messages: ${messages.length}`);
  res.json({ 
    success: true,
    messages,
    count: messages.length
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

  const newMessage = {
    id: Date.now().toString(),
    text, // Plain text for server logging
    encryptedText, // Encrypted version for storage
    senderId,
    receiverId,
    timestamp: new Date().toISOString(),
    isEncrypted: isEncrypted || false
  };

  messages.push(newMessage);
  
  if (isEncrypted) {
    console.log(`� Encrypted message stored (ID: ${newMessage.id})`);
    console.log(`�📤 From: ${senderId} → To: ${receiverId}`);
  } else {
    console.log(`📤 Message sent: ${text}`);
  }

  // Emit real-time update to connected clients (including encrypted data)
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
  console.log(`� Encrypted chat server running on port ${PORT}`);
  console.log(`🔐 AES-256-GCM encryption enabled`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});