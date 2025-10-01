const { default: fetch } = require('node-fetch');

const API_BASE = 'http://localhost:3004';

async function testFirebase() {
  console.log('🔥 Testing Full Firebase Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);

    // Test 2: Get Messages (should use Firestore now)
    console.log('\n2. Testing Messages Endpoint (should use Firestore)...');
    const messagesResponse = await fetch(`${API_BASE}/api/messages`);
    const messagesData = await messagesResponse.json();
    console.log('✅ Messages:', messagesData);

    // Test 3: Send a message (should store in Firestore)
    console.log('\n3. Testing Send Message (should store in Firestore)...');
    const sendResponse = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Test message with full Firebase! 🔥',
        senderId: 'test-user-firebase',
        receiverId: 'test-receiver-firebase'
      })
    });
    const sendData = await sendResponse.json();
    console.log('✅ Send Message:', sendData);

    // Test 4: Get messages again to see the new one
    console.log('\n4. Getting Messages Again (should include new message)...');
    const messagesResponse2 = await fetch(`${API_BASE}/api/messages`);
    const messagesData2 = await messagesResponse2.json();
    console.log('✅ Updated Messages:', messagesData2);

    console.log('\n🎉 Full Firebase integration test completed!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
  }
}

testFirebase();