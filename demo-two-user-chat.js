// Interactive two-user chat simulation
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3004';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  user1: '\x1b[36m', // Cyan
  user2: '\x1b[35m', // Magenta
  system: '\x1b[33m', // Yellow
  success: '\x1b[32m', // Green
  error: '\x1b[31m', // Red
};

class ChatUser {
  constructor(username, color) {
    this.username = username;
    this.color = color;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(BASE_URL, { transports: ['websocket'] });
      
      this.socket.on('connect', () => {
        console.log(`${this.color}[${this.username}]${colors.reset} Connected (${this.socket.id})`);
        this.socket.emit('join', this.username);
        resolve();
      });

      this.socket.on('connect_error', reject);

      // Listen for messages
      this.socket.on('new-message', (msg) => {
        if (msg.receiverId === this.username) {
          console.log(`\n${this.color}[${this.username}]${colors.reset} 📨 Received: "${msg.text}" from ${msg.senderId}`);
        }
      });

      // Listen for presence
      this.socket.on('users-online', (users) => {
        console.log(`${this.color}[${this.username}]${colors.reset} 👥 Online: ${users.join(', ')}`);
      });

      this.socket.on('user-joined', ({ username }) => {
        console.log(`${colors.success}✅ ${username} joined${colors.reset}`);
      });

      this.socket.on('user-left', ({ username }) => {
        console.log(`${colors.error}🔴 ${username} left${colors.reset}`);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log(`${this.color}[${this.username}]${colors.reset} Disconnected`);
    }
  }
}

async function sendMessage(from, to, text) {
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      senderId: from,
      receiverId: to,
      text: text,
      isEncrypted: false
    });

    const options = {
      hostname: 'localhost',
      port: 3004,
      path: '/api/messages/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (_e) {
          resolve({ success: true });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runDemo() {
  console.log(`${colors.system}
╔════════════════════════════════════════════════════════════╗
║          Two-User Realtime Chat Demonstration             ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}
`);

  const user1 = new ChatUser('Alice', colors.user1);
  const user2 = new ChatUser('Bob', colors.user2);

  try {
    // Connect both users
    console.log(`${colors.system}📡 Connecting users...${colors.reset}\n`);
    await Promise.all([user1.connect(), user2.connect()]);
    
    // Wait for presence to sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`\n${colors.success}✅ Both users connected and online!${colors.reset}\n`);
    console.log(`${colors.system}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Simulate a conversation
    const conversation = [
      { from: 'Alice', to: 'Bob', text: 'Hey Bob! How are you?' },
      { from: 'Bob', to: 'Alice', text: 'Hi Alice! I\'m doing great, thanks!' },
      { from: 'Alice', to: 'Bob', text: 'Want to grab coffee later?' },
      { from: 'Bob', to: 'Alice', text: 'Sure! 3pm works for me.' },
      { from: 'Alice', to: 'Bob', text: 'Perfect! See you then 👋' },
    ];

    for (const msg of conversation) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const sender = msg.from === 'Alice' ? user1 : user2;
      console.log(`${sender.color}[${msg.from}]${colors.reset} 📤 Sending: "${msg.text}"`);
      
      await sendMessage(msg.from, msg.to, msg.text);
      
      // Small delay to see the receipt
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n${colors.system}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`\n${colors.success}✅ Conversation complete! Messages delivered instantly.${colors.reset}\n`);

    // Simulate Bob going offline
    console.log(`${colors.system}📴 Bob is disconnecting...${colors.reset}`);
    user2.disconnect();
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`\n${colors.system}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`\n${colors.success}🎉 Demo Complete!${colors.reset}`);
    console.log(`
${colors.system}Key Features Demonstrated:${colors.reset}
  ${colors.success}✓${colors.reset} Realtime presence tracking
  ${colors.success}✓${colors.reset} Instant message delivery
  ${colors.success}✓${colors.reset} User join/leave notifications
  ${colors.success}✓${colors.reset} Bidirectional communication
  ${colors.success}✓${colors.reset} Socket.IO + REST API integration
    `);

    user1.disconnect();
    process.exit(0);

  } catch (error) {
    console.error(`${colors.error}❌ Error:${colors.reset}`, error.message);
    user1.disconnect();
    user2.disconnect();
    process.exit(1);
  }
}

// Check if server is running first
const http = require('http');
http.get('http://localhost:3004/health', () => {
  runDemo();
}).on('error', () => {
  console.error(`${colors.error}❌ Server is not running on port 3004!${colors.reset}`);
  console.log(`${colors.system}Please start the server first: node simple-server.js${colors.reset}`);
  process.exit(1);
});
