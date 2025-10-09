// test-socket-client.js - Test real-time messaging from command line
const io = require('socket.io-client');

console.log('🚀 Starting Socket.IO Real-Time Test...\n');

// Connect to the server
const socket = io('http://localhost:3004', {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnectionAttempts: 5
});

socket.on('connect', () => {
    console.log('✅ Connected to server!');
    console.log('Socket ID:', socket.id);
    
    // Test sending a message through the socket
    setTimeout(() => {
        console.log('\n📤 Testing socket message emission...');
        socket.emit('send-message', {
            roomId: 'test-room',
            senderId: 'socket-test-user',
            receiverId: 'web-user',
            text: 'Hello from Node.js socket client!',
            timestamp: new Date().toISOString()
        });
    }, 2000);
    
    // Test joining a room
    socket.emit('join-room', 'test-room');
    console.log('📡 Joined test-room');
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
    console.log('❌ Connection error:', error.message);
});

// Listen for messages
socket.on('message', (msg) => {
    console.log('📨 Received message via "message" event:', msg);
});

socket.on('receive-message', (msg) => {
    console.log('📨 Received message via "receive-message" event:', msg);
});

// Test API calls
async function testAPI() {
    console.log('\n🔍 Testing API endpoints...');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch('http://localhost:3004/health');
        const health = await healthResponse.json();
        console.log('✅ Health check:', health.status, '- Firebase:', health.firebase);
        
        // Test sending a message via API
        const messageResponse = await fetch('http://localhost:3004/api/messages/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: 'api-test-user',
                receiverId: 'socket-test-user', 
                text: 'Hello from API test!'
            })
        });
        
        const messageResult = await messageResponse.json();
        if (messageResult.success) {
            console.log('✅ API message sent successfully!');
        }
        
        // Test getting messages
        const getResponse = await fetch('http://localhost:3004/api/messages/test');
        const messages = await getResponse.json();
        console.log(`✅ Retrieved ${messages.messages?.length || 0} messages from API`);
        
    } catch (error) {
        console.log('❌ API test error:', error.message);
    }
}

// Import fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Run API test after connection
socket.on('connect', () => {
    setTimeout(testAPI, 3000);
});

// Keep the script running
console.log('🔄 Listening for real-time messages...');
console.log('Press Ctrl+C to exit\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Closing socket connection...');
    socket.disconnect();
    process.exit(0);
});