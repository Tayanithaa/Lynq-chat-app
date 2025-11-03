// Test connectivity from mobile device
const API_BASE_URL = 'http://10.205.184.55:3004';

console.log('🔗 Testing mobile connectivity to server...');
console.log(`📡 Server IP: 10.205.184.55:3004`);
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

async function testConnection() {
  try {
    console.log('\n🏥 Testing health endpoint...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check successful:', data);
    
    console.log('\n📱 Testing message retrieval...');
    const messagesResponse = await fetch(`${API_BASE_URL}/api/messages/test`);
    const messagesData = await messagesResponse.json();
    console.log('✅ Messages endpoint working:', messagesData.count, 'messages');
    
    console.log('\n🎯 Connection test completed successfully!');
    console.log('📲 Your phone should now be able to connect to the server.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure your phone is on the same WiFi network');
    console.log('2. Check Windows Firewall settings');
    console.log('3. Restart the Expo app on your phone');
  }
}

testConnection();