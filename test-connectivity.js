// Simple connectivity test for Lynq Chat App
const fetch = require('node-fetch');

async function testConnectivity() {
  console.log('🔍 Testing Lynq Chat App Connectivity...\n');
  
  try {
    // Test Backend Health
    console.log('1. Testing Backend Health...');
    const healthResponse = await fetch('http://localhost:3004/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health:', healthData);
    
    // Test Backend API
    console.log('\n2. Testing Backend API...');
    const messagesResponse = await fetch('http://localhost:3004/api/messages/test');
    console.log('✅ Messages API Status:', messagesResponse.status);
    
    // Test Frontend
    console.log('\n3. Testing Frontend...');
    const frontendResponse = await fetch('http://localhost:8081');
    console.log('✅ Frontend Status:', frontendResponse.status);
    
    console.log('\n🎉 All systems operational!');
    console.log('\n📱 To test real-time messaging:');
    console.log('   - Open: http://localhost:8081');
    console.log('   - Navigate to Chat screen');
    console.log('   - Send messages between multiple browser tabs');
    
  } catch (error) {
    console.error('❌ Connectivity test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   - Make sure backend is running: cd backend && npm start');
      console.log('   - Make sure frontend is running: npm start');
    }
  }
}

testConnectivity();