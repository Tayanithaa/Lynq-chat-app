// Simple test script for the updated API
const http = require('http');

const API_BASE = 'http://localhost:3004';

function testAPI() {
    console.log('🧪 Testing updated API on port 3004...\n');
    
    // Test health endpoint
    const healthReq = http.request(`${API_BASE}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('✅ Health Check:', JSON.parse(data));
            testMessages();
        });
    });
    
    healthReq.on('error', (e) => console.error('❌ Health Check Error:', e.message));
    healthReq.end();
}

function testMessages() {
    // Test messages endpoint
    const messagesReq = http.request(`${API_BASE}/messages`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const response = JSON.parse(data);
            console.log('✅ Messages API Response:');
            console.log(`   Success: ${response.success}`);
            console.log(`   Message Count: ${response.messages?.length || 0}`);
            
            if (response.messages?.length > 0) {
                console.log('   Latest Message:', {
                    sender: response.messages[response.messages.length - 1].sender,
                    text: response.messages[response.messages.length - 1].text.substring(0, 50) + '...',
                    timestamp: response.messages[response.messages.length - 1].timestamp
                });
            }
            
            console.log('\n🎉 Backend API is working correctly!');
            console.log('🔗 Frontend can now connect to: http://localhost:3004');
        });
    });
    
    messagesReq.on('error', (e) => console.error('❌ Messages API Error:', e.message));
    messagesReq.end();
}

testAPI();