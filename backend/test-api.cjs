// Simple Node.js script to test the message API
const http = require('http');

// Test GET messages
function testGet() {
    const options = {
        hostname: 'localhost',
        port: 3003,
        path: '/messages',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('GET Response:', JSON.parse(data));
            testPost();
        });
    });

    req.on('error', (e) => console.error('GET Error:', e.message));
    req.end();
}

// Test POST message
function testPost() {
    const postData = JSON.stringify({
        sender: 'test-user',
        receiver: 'another-user',
        text: 'Hello from Node.js test!'
    });

    const options = {
        hostname: 'localhost',
        port: 3003,
        path: '/messages',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('POST Response:', JSON.parse(data));
            // Test GET again to see the new message
            setTimeout(testGet, 1000);
        });
    });

    req.on('error', (e) => console.error('POST Error:', e.message));
    req.write(postData);
    req.end();
}

console.log('Testing message API...');
testGet();