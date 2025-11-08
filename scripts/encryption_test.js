// Quick Node script to validate deterministic key generation + AES encrypt/decrypt
// Usage: node scripts/encryption_test.js <userA> <userB> [message]

const CryptoJS = require('crypto-js');

const SECRET_KEY = 'lynq-chat-secret-key-2024-secure';

function normalize(id) {
  return (id || '').toString().trim().toLowerCase();
}

function generateUserKey(userId1, userId2) {
  const a = normalize(userId1);
  const b = normalize(userId2);
  const combined = [a, b].sort().join('-');
  const key = CryptoJS.SHA256(combined + SECRET_KEY).toString();
  return { combined, key };
}

function encryptDeterministic(message, hexKey) {
  const keyWA = CryptoJS.enc.Hex.parse(hexKey);
  const ivHex = CryptoJS.SHA256(hexKey + SECRET_KEY + 'iv').toString().substring(0, 32);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(message, keyWA, { iv: ivWA }).toString();
  return { encrypted, ivHex };
}

function decryptDeterministic(encrypted, hexKey) {
  const keyWA = CryptoJS.enc.Hex.parse(hexKey);
  const ivHex = CryptoJS.SHA256(hexKey + SECRET_KEY + 'iv').toString().substring(0, 32);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const bytes = CryptoJS.AES.decrypt(encrypted, keyWA, { iv: ivWA });
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return plaintext;
}

(async function main(){
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/encryption_test.js <userA> <userB> [message]');
    process.exit(1);
  }
  const [userA, userB, ...rest] = args;
  const message = rest.join(' ') || 'Hello from local test!';

  const { combined, key } = generateUserKey(userA, userB);
  console.log('Combined:', combined);
  console.log('Derived key (SHA256 hex):', key);

  const { encrypted, ivHex } = encryptDeterministic(message, key);
  console.log('\nEncrypted (first 120 chars):', encrypted.substring(0,120));
  console.log('Derived IV (hex preview):', ivHex);

  const decrypted = decryptDeterministic(encrypted, key);
  console.log('\nDecrypted text:', decrypted);

  console.log('\nTest', decrypted === message ? 'PASSED' : 'FAILED');
})();
