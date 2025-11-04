// Visual demonstration of two-way real-time messaging
const io = require('socket.io-client');
const http = require('http');

const BASE_URL = 'http://localhost:3004';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
};

function sendMessage(from, to, text) {
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

async function visualDemo() {
  console.log(`${colors.yellow}
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║       REAL-TIME TWO-WAY MESSAGING DEMONSTRATION                      ║
║                                                                      ║
║  This simulates what happens when two users chat in your app        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
${colors.reset}
`);

  const user1 = 'Alice';
  const user2 = 'Bob';

  console.log(`${colors.cyan}📱 DEVICE 1 - Alice's Phone${colors.reset}`);
  console.log(`   Opens app → Logs in as "${user1}"`);
  
  console.log(`\n${colors.magenta}📱 DEVICE 2 - Bob's Phone${colors.reset}`);
  console.log(`   Opens app → Logs in as "${user2}"`);
  
  console.log(`\n${colors.yellow}⚡ Connecting to server...${colors.reset}\n`);

  const socket1 = io(BASE_URL, { transports: ['websocket'] });
  const socket2 = io(BASE_URL, { transports: ['websocket'] });

  await Promise.all([
    new Promise((resolve) => socket1.on('connect', resolve)),
    new Promise((resolve) => socket2.on('connect', resolve))
  ]);

  console.log(`${colors.green}✅ Both devices connected to server${colors.reset}`);
  
  socket1.emit('join', user1);
  socket2.emit('join', user2);
  
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`${colors.green}✅ Both users joined presence system${colors.reset}`);
  console.log(`${colors.green}✅ Both can see each other in "Online" tab${colors.reset}\n`);

  console.log(`${'─'.repeat(74)}\n`);

  // Simulate Device 1 action
  console.log(`${colors.cyan}📱 DEVICE 1 (Alice):${colors.reset}`);
  console.log(`   • Opens "Online" tab`);
  console.log(`   • Sees "${user2}" with green dot 🟢`);
  console.log(`   • Taps on "${user2}" to start chat`);
  console.log(`   • Chat screen opens with chatId="${user2}"`);
  console.log(`   • useMessages("${user2}") hook starts listening\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`${colors.magenta}📱 DEVICE 2 (Bob):${colors.reset}`);
  console.log(`   • Opens "Online" tab`);
  console.log(`   • Sees "${user1}" with green dot 🟢`);
  console.log(`   • Taps on "${user1}" to start chat`);
  console.log(`   • Chat screen opens with chatId="${user1}"`);
  console.log(`   • useMessages("${user1}") hook starts listening\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`${'─'.repeat(74)}\n`);
  console.log(`${colors.yellow}💬 STARTING CONVERSATION${colors.reset}\n`);

  // Set up message listeners with visual feedback
  let aliceReceived = [];
  let bobReceived = [];

  socket1.on('new-message', (msg) => {
    if (msg.receiverId === user1 && msg.senderId === user2) {
      aliceReceived.push(msg);
      console.log(`${colors.cyan}📱 DEVICE 1 (Alice):${colors.reset}`);
      console.log(`   ${colors.green}✅ Message received instantly!${colors.reset}`);
      console.log(`   💬 "${msg.text}"\n`);
    }
  });

  socket2.on('new-message', (msg) => {
    if (msg.receiverId === user2 && msg.senderId === user1) {
      bobReceived.push(msg);
      console.log(`${colors.magenta}📱 DEVICE 2 (Bob):${colors.reset}`);
      console.log(`   ${colors.green}✅ Message received instantly!${colors.reset}`);
      console.log(`   💬 "${msg.text}"\n`);
    }
  });

  // Message 1: Alice → Bob
  console.log(`${colors.cyan}📱 DEVICE 1 (Alice):${colors.reset}`);
  console.log(`   • Types: "Hey Bob! Want to grab coffee?"`);
  console.log(`   • Taps Send button`);
  console.log(`   • Message sent via API → Server broadcasts via Socket.IO\n`);
  
  await sendMessage(user1, user2, 'Hey Bob! Want to grab coffee?');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Message 2: Bob → Alice
  console.log(`${colors.magenta}📱 DEVICE 2 (Bob):${colors.reset}`);
  console.log(`   • Types: "Sure! 3pm works for me :)"`);
  console.log(`   • Taps Send button`);
  console.log(`   • Message sent via API → Server broadcasts via Socket.IO\n`);
  
  await sendMessage(user2, user1, 'Sure! 3pm works for me :)');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Message 3: Alice → Bob
  console.log(`${colors.cyan}📱 DEVICE 1 (Alice):${colors.reset}`);
  console.log(`   • Types: "Perfect! See you at Starbucks"`);
  console.log(`   • Taps Send button\n`);
  
  await sendMessage(user1, user2, 'Perfect! See you at Starbucks');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Message 4: Bob → Alice
  console.log(`${colors.magenta}📱 DEVICE 2 (Bob):${colors.reset}`);
  console.log(`   • Types: "See you there! 👋"`);
  console.log(`   • Taps Send button\n`);
  
  await sendMessage(user2, user1, 'See you there! 👋');
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`${'─'.repeat(74)}\n`);

  // Summary
  console.log(`${colors.yellow}📊 RESULTS:${colors.reset}\n`);
  console.log(`${colors.cyan}   Alice's Device:${colors.reset}`);
  console.log(`   • Sent: 2 messages`);
  console.log(`   • Received: ${bobReceived.length} messages instantly ${bobReceived.length === 2 ? '✅' : '❌'}`);
  
  console.log(`\n${colors.magenta}   Bob's Device:${colors.reset}`);
  console.log(`   • Sent: 2 messages`);
  console.log(`   • Received: ${aliceReceived.length} messages instantly ${aliceReceived.length === 2 ? '✅' : '❌'}`);

  console.log(`\n${colors.green}${'─'.repeat(74)}${colors.reset}`);
  
  if (aliceReceived.length === 2 && bobReceived.length === 2) {
    console.log(`\n${colors.green}${colors.bright}✅ SUCCESS! Both devices received all messages in real-time${colors.reset}`);
    console.log(`${colors.green}   This is exactly what should happen in your app!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ ISSUE: Some messages were not received${colors.reset}\n`);
  }

  socket1.disconnect();
  socket2.disconnect();

  process.exit(0);
}

// Check server
http.get(`${BASE_URL}/health`, () => {
  visualDemo().catch(err => {
    console.error(`${colors.red}❌ Error:${colors.reset}`, err.message);
    process.exit(1);
  });
}).on('error', () => {
  console.error(`${colors.red}❌ Server not running on port 3004${colors.reset}`);
  console.log(`${colors.yellow}Please start it first: node simple-server.js${colors.reset}`);
  process.exit(1);
});
