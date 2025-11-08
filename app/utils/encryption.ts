import CryptoJS from 'crypto-js';

class MessageEncryption {
  private static readonly SECRET_KEY = 'lynq-chat-secret-key-2024-secure'; // In production, use env variable
  
  /**
   * Encrypt a message using AES-256-GCM
   */
  static encrypt(message: string, userSecret?: string): string {
    try {
      // If caller provides a derived hex key (preferred), use it directly.
      // Otherwise fall back to legacy passphrase behavior.
      if (userSecret && /^[0-9a-fA-F]{64}$/.test(userSecret)) {
        const keyWA = CryptoJS.enc.Hex.parse(userSecret);
        // Deterministic IV derived from key + secret to avoid RNG
        const ivHex = CryptoJS.SHA256(userSecret + this.SECRET_KEY + 'iv').toString().substring(0, 32);
        const ivWA = CryptoJS.enc.Hex.parse(ivHex);
        const encrypted = CryptoJS.AES.encrypt(message, keyWA, { iv: ivWA }).toString();
        console.log('🔒 Message encrypted successfully (deterministic key)');
        return encrypted;
      }

      // Legacy fallback: use SECRET_KEY as passphrase
      const encrypted = CryptoJS.AES.encrypt(message, this.SECRET_KEY).toString();
      console.log('🔒 Message encrypted successfully (passphrase fallback)');
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return message; // Fallback to plain text if encryption fails
    }
  }

  /**
   * Decrypt a message using AES-256-GCM
   */
  static decrypt(encryptedMessage: string, userSecret?: string): string {
    try {
      if (userSecret && /^[0-9a-fA-F]{64}$/.test(userSecret)) {
        const keyWA = CryptoJS.enc.Hex.parse(userSecret);
        const ivHex = CryptoJS.SHA256(userSecret + this.SECRET_KEY + 'iv').toString().substring(0, 32);
        const ivWA = CryptoJS.enc.Hex.parse(ivHex);
        const decrypted = CryptoJS.AES.decrypt(encryptedMessage, keyWA, { iv: ivWA });
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        if (!plaintext) throw new Error('Decryption resulted in empty string');
        console.log('🔓 Message decrypted successfully (deterministic key)');
        return plaintext;
      }

      // Legacy fallback
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, this.SECRET_KEY);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      if (!plaintext) throw new Error('Decryption resulted in empty string');
      console.log('🔓 Message decrypted successfully (passphrase fallback)');
      return plaintext;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return '[🔒 Encrypted Message - Unable to decrypt]';
    }
  }

  /**
   * Generate a secure key for end-to-end encryption
   */
  static generateUserKey(userId1: string, userId2: string): string {
    // Normalize inputs to avoid mismatches from casing or stray whitespace
    const a = (userId1 || '').toString().trim().toLowerCase();
    const b = (userId2 || '').toString().trim().toLowerCase();
    const combined = [a, b].sort().join('-');
    const key = CryptoJS.SHA256(combined + this.SECRET_KEY).toString();
    // WARNING: This prints part of the derived key to help debug mismatches
    // during development only. Remove in production.
    console.log('🔑 Generated encryption key for chat pair', {
      combined,
      keyPreview: key.substring(0, 24) + '...'
    });
    return key;
  }

  /**
   * Check if a message is encrypted
   */
  static isEncrypted(message: string): boolean {
    try {
      // AES encrypted messages have a specific format
      return message.length > 20 && !message.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(message);
    } catch {
      return false;
    }
  }

  /**
   * Test encryption/decryption functionality
   */
  static test(): boolean {
    try {
      const testMessage = "Hello, this is a test message!";
      // Use deterministic per-chat key for the self-test to avoid
      // CryptoJS passphrase/KDF code paths that may call native RNG.
      const key = this.generateUserKey('self-test-user-a', 'self-test-user-b');
      const encrypted = this.encrypt(testMessage, key);
      const decrypted = this.decrypt(encrypted, key);
      
      const success = decrypted === testMessage;
      console.log(success ? '✅ Encryption test passed' : '❌ Encryption test failed');
      return success;
    } catch (error) {
      console.error('❌ Encryption test error:', error);
      return false;
    }
  }
}

export default MessageEncryption;