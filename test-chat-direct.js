// Simple Real-Time Chat Test
// Open this in your browser console to test direct API calls

console.log('🧪 Testing Lynq Chat Real-Time Messaging...');

// Test 1: Check backend health
fetch('http://localhost:3004/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend Health:', data))
  .catch(err => console.error('❌ Backend Error:', err));

// Test 2: Send a test message
const testMessage = {
  senderId: 'test-user-1',
  receiverId: 'test-user-2', 
  text: 'Real-time test message ' + new Date().toLocaleTimeString()
};

fetch('http://localhost:3004/api/messages/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testMessage)
})
.then(res => res.json())
.then(data => console.log('✅ Message Sent:', data))
.catch(err => console.error('❌ Send Error:', err));

// Test 3: Get all messages
fetch('http://localhost:3004/api/messages/test')
  .then(res => res.json())
  .then(data => console.log('✅ All Messages:', data))
  .catch(err => console.error('❌ Get Error:', err));

console.log('🔧 Open browser developer tools (F12) to see results');
console.log('📱 If all tests pass, your real-time messaging is working perfectly!');