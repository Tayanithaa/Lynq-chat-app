// Simple connection test
const API_BASE_URL = 'http://localhost:3004';

async function testConnection() {
    console.log('🧪 Testing Frontend-Backend Connection...\n');
    
    try {
        // Test 1: Health Check
        console.log('1. Testing Health Endpoint...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData);
        
        // Test 2: Messages Endpoint
        console.log('\n2. Testing Messages Endpoint...');
        const messagesResponse = await fetch(`${API_BASE_URL}/messages`);
        const messagesData = await messagesResponse.json();
        console.log('✅ Messages API:', messagesData);
        
        // Test 3: Send Test Message
        console.log('\n3. Testing Send Message...');
        const sendResponse = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: 'Test message from frontend connection test',
                senderId: 'test-user-frontend',
                receiverId: 'test-user-backend'
            })
        });
        const sendData = await sendResponse.json();
        console.log('✅ Send Message:', sendData);
        
        console.log('\n🎉 All tests passed! Frontend and Backend are connected!');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
    }
}

// Run the test
testConnection();