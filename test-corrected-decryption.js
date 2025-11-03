// Test decryption with the corrected secret key
const CryptoJS = require('crypto-js');

// Match your app's encryption exactly
function generateKey(userId1, userId2) {
  const SECRET_KEY = 'lynq-chat-secret-key-2024-secure';
  const combined = [userId1, userId2].sort().join('-');
  const key = CryptoJS.SHA256(combined + SECRET_KEY).toString();
  return key;
}

function encrypt(message, userId1, userId2) {
  const key = generateKey(userId1, userId2);
  return CryptoJS.AES.encrypt(message, key).toString();
}

function decrypt(encryptedText, userId1, userId2) {
  const key = generateKey(userId1, userId2);
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Test the encryption/decryption cycle
const message = "Hello! This should now decrypt correctly! 🎉";
const user1 = "person1@example.com";
const user2 = "person2@example.com";

console.log('🧪 Testing corrected encryption/decryption...\n');
console.log('📝 Original message:', message);

// Encrypt
const encrypted = encrypt(message, user1, user2);
console.log('🔒 Encrypted:', encrypted);

// Decrypt locally to verify
const decrypted = decrypt(encrypted, user1, user2);
console.log('🔓 Local decrypt:', decrypted);
console.log('✅ Local test match:', message === decrypted);

// Send to backend
const payload = {
  text: message,
  senderId: user1,
  receiverId: user2,
  encryptedText: encrypted,
  isEncrypted: true
};

console.log('\n🚀 Sending to backend to test decryption...');

fetch('http://localhost:3004/api/messages/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('✅ Message sent successfully!');
    
    // Now fetch messages to see backend decryption
    return fetch('http://localhost:3004/api/messages/test');
  }
  throw new Error('Failed to send message');
})
.then(response => response.json())
.then(data => {
  console.log('\n📋 Backend retrieval complete');
  console.log('💡 Check the server console for decryption results!');
  console.log(`📨 Total messages: ${data.count}`);
})
.catch(error => {
  console.error('❌ Error:', error.message);
  console.log('💡 Make sure the server is running on port 3004');
});