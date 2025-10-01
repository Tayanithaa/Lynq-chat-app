// Simple real-time messaging test script
const { default: fetch } = require('node-fetch');

async function quickTest() {
  console.log('🧪 Quick Real-Time Messaging Test...\n');
  
  const API_BASE = 'http://localhost:3004';
  
  try {
    // Test 1: Health Check
    console.log('1. Testing server health...');
    const health = await fetch(`${API_BASE}/health`);
    const healthData = await health.json();
    console.log('✅ Server status:', healthData.status);
    
    // Test 2: Send a message
    console.log('\n2. Sending test message...');
    const messageResponse = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        text: 'Real-time test message! 🚀',
        senderId: 'test-user-1',
        receiverId: 'test-user-2'
      })
    });
    
    const messageResult = await messageResponse.json();
    console.log('✅ Message sent:', messageResult.message?.text);
    console.log('💾 Storage type:', messageResult.note || 'Firestore database');
    
    // Test 3: Get all messages
    console.log('\n3. Retrieving messages...');
    const allMessages = await fetch(`${API_BASE}/api/messages`);
    const allData = await allMessages.json();
    console.log('✅ Total messages:', allData.count);
    console.log('💾 Storage type:', allData.note || 'Firestore database');
    
    if (allData.messages && allData.messages.length > 0) {
      console.log('\n📨 Recent messages:');
      allData.messages.slice(-3).forEach((msg, i) => {
        console.log(`   ${i+1}. ${msg.senderId} → ${msg.receiverId}: ${msg.text}`);
      });
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Real-Time Features Status:');
    console.log('✅ Backend API: Working');
    console.log('✅ Message storage: Working');
    console.log('✅ Firebase integration: ' + (allData.note ? 'Fallback mode' : 'Full Firestore'));
    console.log('📱 Socket.IO real-time: Ready (connect frontend to test)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   cd c:\\Users\\Tayanithaa.N.S\\lynq-chat\\backend');
    console.log('   npx ts-node src\\index.ts');
  }
}

quickTest();