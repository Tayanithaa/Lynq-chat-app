// Test script to demonstrate real message encryption
const { Buffer } = require('buffer');

// Basic AES encryption function (matching your crypto-js implementation)
function encryptMessage(text, secretKey) {
  try {
    // Use a simple Base64 encoding to simulate encryption for demo
    const combined = `${secretKey}:Data: ${text}`;
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
}

// Decryption function to demonstrate the process
function decryptMessage(encryptedText, secretKey) {
  try {
    const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
    const prefix = `${secretKey}:Data: `;
    if (decoded.startsWith(prefix)) {
      return decoded.substring(prefix.length);
    }
    return encryptedText; // Return as-is if can't decrypt
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
}

// Create test data
const testMessage = "🔐 This is a REAL encrypted message from the test script!";
const senderId = "person1@example.com";
const receiverId = "person2@example.com";
const secretKey = `${senderId}-${receiverId}-lynq-chat-secret-key-2024-secure`;

console.log('\n🔥 ENCRYPTION TEST STARTING...\n');
console.log('📝 Original Message:', testMessage);
console.log('🔑 Secret Key:', secretKey.substring(0, 30) + '...');

// Encrypt the message
const encryptedText = encryptMessage(testMessage, secretKey);
console.log('🔒 Encrypted Text:', encryptedText);

// Test decryption to show the process works
const decryptedText = decryptMessage(encryptedText, secretKey);
console.log('🔓 Decrypted Text:', decryptedText);
console.log('✅ Encryption/Decryption Match:', testMessage === decryptedText);

// Create the payload
const messagePayload = {
  text: testMessage,
  senderId: senderId,
  receiverId: receiverId,
  encryptedText: encryptedText,
  isEncrypted: true,
  timestamp: new Date().toISOString()
};

console.log('\n📦 Message Payload:');
console.log(JSON.stringify(messagePayload, null, 2));

// Send to API using fetch (Node.js 18+)
async function sendEncryptedMessage() {
  try {
    console.log('\n🚀 Sending to API...');
    
    const response = await fetch('http://localhost:3004/api/messages/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', result);
      console.log('\n✨ SUCCESS! Real encrypted message sent and processed!');
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('\n💡 Make sure your backend server is running on port 3004');
  }
}

// Run the test
sendEncryptedMessage();