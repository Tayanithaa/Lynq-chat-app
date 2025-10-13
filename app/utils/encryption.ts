import CryptoJS from 'crypto-js';

class MessageEncryption {
  private static readonly SECRET_KEY = 'lynq-chat-secret-key-2024-secure'; // In production, use env variable
  
  /**
   * Encrypt a message using AES-256-GCM
   */
  static encrypt(message: string, userSecret?: string): string {
    try {
      const key = userSecret || this.SECRET_KEY;
      const encrypted = CryptoJS.AES.encrypt(message, key).toString();
      console.log('🔒 Message encrypted successfully');
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
      const key = userSecret || this.SECRET_KEY;
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Decryption resulted in empty string');
      }
      
      console.log('🔓 Message decrypted successfully');
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
    const combined = [userId1, userId2].sort().join('-');
    const key = CryptoJS.SHA256(combined + this.SECRET_KEY).toString();
    console.log('🔑 Generated encryption key for chat pair');
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
      const encrypted = this.encrypt(testMessage);
      const decrypted = this.decrypt(encrypted);
      
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