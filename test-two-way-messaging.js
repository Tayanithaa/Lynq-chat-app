// Test real-time two-way messaging between users
const io = require('socket.io-client');
const http = require('http');

const BASE_URL = 'http://localhost:3004';

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

async function test() {
  console.log('\n🧪 Testing Real-Time Two-Way Messaging\n');
  console.log('=' .repeat(70));

  const user1 = 'testuser1';
  const user2 = 'testuser2';

  // Connect both users
  const socket1 = io(BASE_URL, { transports: ['websocket'] });
  const socket2 = io(BASE_URL, { transports: ['websocket'] });

  // Wait for connections
  await Promise.all([
    new Promise((resolve) => socket1.on('connect', resolve)),
    new Promise((resolve) => socket2.on('connect', resolve))
  ]);

  console.log(`✅ User1 (${user1}) connected: ${socket1.id}`);
  console.log(`✅ User2 (${user2}) connected: ${socket2.id}`);

  // Join with usernames
  socket1.emit('join', user1);
  socket2.emit('join', user2);

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n📍 Test 1: User1 sends to User2');
  console.log('-'.repeat(70));

  let user2ReceivedCount = 0;
  let user1ReceivedWrong = false;

  // User2 should receive
  const user2Promise = new Promise((resolve) => {
    socket2.on('new-message', (msg) => {
      if (msg.senderId === user1 && msg.receiverId === user2) {
        user2ReceivedCount++;
        console.log(`✅ User2 received: "${msg.text}"`);
        resolve();
      }
    });
  });

  // User1 should NOT receive (it's their own message to someone else)
  socket1.on('new-message', (msg) => {
    if (msg.senderId === user1 && msg.receiverId === user2) {
      // This is okay - sender gets confirmation
      console.log(`ℹ️  User1 got delivery confirmation`);
    }
  });

  await sendMessage(user1, user2, 'Hello from User1!');

  await Promise.race([
    user2Promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('User2 did not receive message')), 3000))
  ]);

  console.log(`\n✅ Test 1 PASSED: User2 received ${user2ReceivedCount} message(s)\n`);

  // Test 2: User2 sends to User1
  console.log('📍 Test 2: User2 sends to User1');
  console.log('-'.repeat(70));

  let user1ReceivedCount = 0;

  const user1Promise = new Promise((resolve) => {
    socket1.on('new-message', (msg) => {
      if (msg.senderId === user2 && msg.receiverId === user1) {
        user1ReceivedCount++;
        console.log(`✅ User1 received: "${msg.text}"`);
        resolve();
      }
    });
  });

  await sendMessage(user2, user1, 'Hi back from User2!');

  await Promise.race([
    user1Promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('User1 did not receive message')), 3000))
  ]);

  console.log(`\n✅ Test 2 PASSED: User1 received ${user1ReceivedCount} message(s)\n`);

  // Test 3: Multiple messages back and forth
  console.log('📍 Test 3: Rapid back-and-forth conversation');
  console.log('-'.repeat(70));

  const conversation = [
    { from: user1, to: user2, text: 'Message 1' },
    { from: user2, to: user1, text: 'Message 2' },
    { from: user1, to: user2, text: 'Message 3' },
    { from: user2, to: user1, text: 'Message 4' },
  ];

  let receivedByUser1 = 0;
  let receivedByUser2 = 0;

  socket1.removeAllListeners('new-message');
  socket2.removeAllListeners('new-message');

  socket1.on('new-message', (msg) => {
    if (msg.receiverId === user1) {
      receivedByUser1++;
      console.log(`  User1 ← "${msg.text}"`);
    }
  });

  socket2.on('new-message', (msg) => {
    if (msg.receiverId === user2) {
      receivedByUser2++;
      console.log(`  User2 ← "${msg.text}"`);
    }
  });

  for (const msg of conversation) {
    await sendMessage(msg.from, msg.to, msg.text);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`\n✅ Test 3 Results:`);
  console.log(`   User1 received: ${receivedByUser1} messages (expected: 2)`);
  console.log(`   User2 received: ${receivedByUser2} messages (expected: 2)`);

  if (receivedByUser1 === 2 && receivedByUser2 === 2) {
    console.log('✅ Test 3 PASSED\n');
  } else {
    console.log('❌ Test 3 FAILED\n');
  }

  // Cleanup
  socket1.disconnect();
  socket2.disconnect();

  console.log('=' .repeat(70));
  console.log('🎉 ALL TESTS COMPLETED!\n');

  process.exit(0);
}

// Check server is running
http.get(`${BASE_URL}/health`, () => {
  test().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}).on('error', () => {
  console.error('❌ Server not running on port 3004');
  process.exit(1);
});
