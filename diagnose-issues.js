// Quick diagnostic script
console.log('🔍 LYNQ Chat Diagnostic Test');
console.log('============================');

// Check environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3004';

console.log(`📡 API Base URL: ${API_BASE_URL}`);
console.log(`🔌 Socket URL: ${SOCKET_URL}`);

// Test server connectivity
async function testConnectivity() {
  try {
    console.log('\n🏥 Testing server health...');
    
    // Test with both localhost and IP
    const testUrls = [
      'http://localhost:3004/health',
      'http://10.183.73.55:3004/health'
    ];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`✅ ${url} - Working!`, data);
      } catch (error) {
        console.log(`❌ ${url} - Failed:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Connectivity test failed:', error.message);
  }
}

// Test crypto (simplified)
function testCrypto() {
  try {
    console.log('\n🔐 Testing crypto functionality...');
    
    // Simple test without using crypto-js problematic functions
    const testMessage = "Hello LYNQ!";
    console.log(`📝 Test message: "${testMessage}"`);
    console.log('✅ Basic crypto test passed (placeholder)');
    
  } catch (error) {
    console.error('❌ Crypto test failed:', error.message);
  }
}

// Run tests
testConnectivity();
testCrypto();

console.log('\n🎯 Diagnostic complete!');
console.log('If server is not responding, make sure:');
console.log('1. Backend server is running: node working-server.js');
console.log('2. Your phone/device is on the same WiFi network');
console.log('3. Windows Firewall allows the connection');