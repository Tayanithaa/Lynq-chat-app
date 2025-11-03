// Test script to send a REAL AES encrypted message like your app
const CryptoJS = require('crypto-js');

// Match your app's encryption exactly
function encryptMessage(text, secretKey) {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, secretKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

function decryptMessage(encryptedText, secretKey) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
}

// Test data - exactly like your app
const testMessage = "🔐 Hello! This is a REAL AES encrypted message!";
const senderId = "person1@example.com";
const receiverId = "person2@example.com";
const secretKey = `${senderId}-${receiverId}-lynq-chat-secret-key-2024-secure`;

console.log('\n🔥 REAL AES ENCRYPTION TEST STARTING...\n');
console.log('📝 Original Message:', testMessage);
console.log('🔑 Secret Key:', secretKey.substring(0, 40) + '...');

// Encrypt using AES (like your app)
const encryptedText = encryptMessage(testMessage, secretKey);
console.log('🔒 AES Encrypted Text:', encryptedText);

// Test local decryption
const localDecrypted = decryptMessage(encryptedText, secretKey);
console.log('🔓 Local Decrypted:', localDecrypted);
console.log('✅ Local Encryption/Decryption Match:', testMessage === localDecrypted);

// Create payload
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

// Send to API
async function sendRealEncryptedMessage() {
  try {
    console.log('\n🚀 Sending AES encrypted message to backend...');
    
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
      console.log('\n🎉 SUCCESS! Real AES encrypted message sent!');
      console.log('💡 Check the backend console for detailed encryption/decryption logs!');
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('❌ Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('\n💡 Make sure your backend server is running on port 3004');
    console.log('💡 Try: node simple-server.js');
  }
}

// Test fetching messages to see decryption
async function fetchMessages() {
  try {
    console.log('\n📋 Fetching messages to see backend decryption...');
    
    const response = await fetch('http://localhost:3004/api/messages/test');
    
    if (response.ok) {
      const result = await response.json();
      console.log('📨 Messages retrieved:', result.count);
      console.log('💡 Check the backend console for decryption details!');
    } else {
      console.log('❌ Fetch Error:', response.status);
    }
  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
  }
}

// Run the test
async function runTest() {
  await sendRealEncryptedMessage();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await fetchMessages();
}

runTest();