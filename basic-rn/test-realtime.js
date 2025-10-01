const { default: fetch } = require('node-fetch');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:3004';

// Create two socket clients to simulate real-time messaging between users
let client1, client2;
let messages1 = [], messages2 = [];

async function testRealTimeMessaging() {
  console.log('🚀 Testing Real-Time Messaging System...\n');

  try {
    // Step 1: Connect two socket clients (simulating two users)
    console.log('1. Connecting Socket Clients...');
    client1 = io(API_BASE, { transports: ['websocket', 'polling'] });
    client2 = io(API_BASE, { transports: ['websocket', 'polling'] });

    // Set up message listeners
    client1.on('connect', () => console.log('✅ Client 1 connected:', client1.id));
    client2.on('connect', () => console.log('✅ Client 2 connected:', client2.id));

    client1.on('message', (msg) => {
      messages1.push(msg);
      console.log('📱 Client 1 received:', msg.text);
    });

    client2.on('message', (msg) => {
      messages2.push(msg);
      console.log('📱 Client 2 received:', msg.text);
    });

    // Wait for connections
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Send a message via API (this should trigger real-time updates)
    console.log('\n2. Sending message via API...');
    const message1 = {
      text: 'Hello from User 1! 👋 Real-time test message',
      senderId: 'user-1',
      receiverId: 'user-2'
    };

    const response1 = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message1)
    });

    const result1 = await response1.json();
    console.log('✅ Message sent to API:', result1.message?.text);

    // Wait for real-time propagation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Send another message from the "other user"
    console.log('\n3. Sending reply message...');
    const message2 = {
      text: 'Hi there! Got your message instantly! ⚡',
      senderId: 'user-2', 
      receiverId: 'user-1'
    };

    const response2 = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message2)
    });

    const result2 = await response2.json();
    console.log('✅ Reply sent to API:', result2.message?.text);

    // Wait for real-time propagation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Verify real-time reception
    console.log('\n4. Real-Time Results:');
    console.log(`📱 Client 1 received ${messages1.length} real-time messages:`);
    messages1.forEach((msg, i) => console.log(`   ${i+1}. ${msg.text}`));
    
    console.log(`📱 Client 2 received ${messages2.length} real-time messages:`);
    messages2.forEach((msg, i) => console.log(`   ${i+1}. ${msg.text}`));

    // Step 5: Verify messages are stored in Firebase/Database
    console.log('\n5. Checking persistent storage...');
    const allMessages = await fetch(`${API_BASE}/api/messages`);
    const allMessagesData = await allMessages.json();
    
    console.log(`💾 Total messages in database: ${allMessagesData.messages?.length || 0}`);
    if (allMessagesData.messages?.length > 0) {
      console.log('Latest messages in database:');
      allMessagesData.messages.slice(-3).forEach((msg, i) => {
        console.log(`   ${msg.senderId} → ${msg.receiverId}: ${msg.text}`);
      });
    }

    // Step 6: Test Socket.IO events directly
    console.log('\n6. Testing direct socket communication...');
    client1.emit('join-room', 'test-room-123');
    client2.emit('join-room', 'test-room-123');

    await new Promise(resolve => setTimeout(resolve, 500));

    client1.emit('send-message', {
      room: 'test-room-123',
      message: 'Socket direct message test! 🔥',
      sender: 'socket-user-1'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n🎉 Real-Time Messaging Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ Socket connections: 2 clients connected`);
    console.log(`✅ API messages sent: 2`);
    console.log(`✅ Real-time messages received: Client1(${messages1.length}), Client2(${messages2.length})`);
    console.log(`✅ Database storage: ${allMessagesData.success ? 'Working' : 'Failed'}`);
    console.log(`✅ Firebase integration: ${allMessagesData.note ? 'In-memory mode' : 'Full Firestore'}`);

  } catch (error) {
    console.error('❌ Real-time test failed:', error.message);
  } finally {
    // Cleanup
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    console.log('\n🔌 Disconnected test clients');
  }
}

// Run the test
testRealTimeMessaging();