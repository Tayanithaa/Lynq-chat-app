// Test realtime chat flow with presence and messaging
const io = require('socket.io-client');
const http = require('http');

const BASE_URL = 'http://localhost:3004';

// Helper to make HTTP requests
function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testRealtimeFlow() {
  console.log('🧪 Testing Realtime Chat Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check server health
    console.log('\n📍 Step 1: Checking server health...');
    const health = await request('/health');
    console.log('✅ Server is healthy:', health);

    // Step 2: Create two socket connections (simulating two users)
    console.log('\n📍 Step 2: Connecting two users via Socket.IO...');
    
    const user1 = 'testuser1';
    const user2 = 'testuser2';
    
    const socket1 = io(BASE_URL, { transports: ['websocket'] });
    const socket2 = io(BASE_URL, { transports: ['websocket'] });

    // Wait for connections
    await Promise.all([
      new Promise((resolve) => socket1.on('connect', resolve)),
      new Promise((resolve) => socket2.on('connect', resolve))
    ]);

    console.log(`✅ User1 connected: ${socket1.id}`);
    console.log(`✅ User2 connected: ${socket2.id}`);

    // Step 3: Join presence with usernames
    console.log('\n📍 Step 3: Joining presence...');
    
    const presencePromises = [
      new Promise((resolve) => {
        socket1.once('users-online', (users) => {
          console.log(`✅ User1 received online list: ${users.join(', ')}`);
          resolve();
        });
        socket1.emit('join', user1);
      }),
      new Promise((resolve) => {
        socket2.once('users-online', (users) => {
          console.log(`✅ User2 received online list: ${users.join(', ')}`);
          resolve();
        });
        socket2.emit('join', user2);
      })
    ];

    await Promise.all(presencePromises);

    // Wait a bit for presence to sync
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4: Check online users endpoint
    console.log('\n📍 Step 4: Checking online users via REST API...');
    const onlineUsers = await request('/api/users/online');
    console.log('✅ Online users:', onlineUsers);

    // Step 5: Send a message from user1 to user2
    console.log('\n📍 Step 5: Sending message from user1 to user2...');
    
    const messagePromise = new Promise((resolve) => {
      socket2.once('new-message', (msg) => {
        console.log('✅ User2 received realtime message:', msg);
        resolve(msg);
      });
    });

    const sendResult = await request('/api/messages/test', 'POST', {
      senderId: user1,
      receiverId: user2,
      text: 'Hello from user1! Testing realtime messaging.',
      isEncrypted: false
    });

    console.log('✅ Message sent:', sendResult.data);
    
    const receivedMsg = await Promise.race([
      messagePromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Message receive timeout')), 3000)
      )
    ]);

    console.log('✅ Message delivered in realtime!');

    // Step 6: Test presence when user disconnects
    console.log('\n📍 Step 6: Testing user disconnect...');
    
    const disconnectPromise = new Promise((resolve) => {
      socket1.once('user-left', (data) => {
        console.log(`✅ User1 notified: ${data.username} went offline`);
        resolve();
      });
    });

    socket2.disconnect();
    
    await Promise.race([
      disconnectPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Disconnect notification timeout')), 3000)
      )
    ]);

    // Clean up
    socket1.disconnect();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✨ Summary:');
    console.log('   ✅ Server health check');
    console.log('   ✅ Socket.IO connections');
    console.log('   ✅ Presence tracking (join/leave)');
    console.log('   ✅ Online users REST endpoint');
    console.log('   ✅ Realtime message delivery');
    console.log('   ✅ Disconnect notifications');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

testRealtimeFlow();
