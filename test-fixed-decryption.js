// Test the fixed decryption logic
const CryptoJS = require('crypto-js');

// Exact key generation from your app
function generateUserKey(userId1, userId2) {
  const SECRET_KEY = '-lynq-chat-secret-key-2024-secure';
  const combined = [userId1, userId2].sort().join('-');
  const key = CryptoJS.SHA256(combined + SECRET_KEY).toString();
  return key;
}

function encryptMessage(text, secretKey) {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

// Test message from person2 to person1 (the failing case)
const message = "Hello I am sending encrypted message from person2!";
const senderId = "person2@example.com";
const receiverId = "person1@example.com";

// Generate key exactly like your app
const key = generateUserKey(senderId, receiverId);
console.log('🔑 Generated key:', key.substring(0, 20) + '...');

// Encrypt
const encrypted = encryptMessage(message, key);
console.log('🔒 Encrypted:', encrypted);

// Test payload
const payload = {
  text: message,
  senderId: senderId,
  receiverId: receiverId,
  encryptedText: encrypted,
  isEncrypted: true
};

// Send to server
fetch('http://localhost:3004/api/messages/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  console.log('✅ Message sent successfully!');
  console.log('Backend response:', data);
  
  // Now fetch messages to see decryption
  return fetch('http://localhost:3004/api/messages/test');
})
.then(response => response.json())
.then(data => {
  console.log('📋 Retrieved messages:', data.count);
  console.log('💡 Check the server console for decryption details!');
})
.catch(error => {
  console.error('❌ Error:', error.message);
});