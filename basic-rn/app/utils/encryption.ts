// Encryption utility for frontend
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly SECRET_KEY = 'lynq-default-secret-key-2024';

  static encryptMessage(message: string): { encrypted: string; iv: string } {
    try {
      const iv = CryptoJS.lib.WordArray.random(128/8);
      const encrypted = CryptoJS.AES.encrypt(message, this.SECRET_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }).toString();

      return { 
        encrypted, 
        iv: iv.toString() 
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  static decryptMessage(encryptedData: { encrypted: string; iv: string }): string {
    try {
      const { encrypted, iv } = encryptedData;
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  static encryptMediaData(mediaData: any): { encrypted: string; iv: string } {
    return this.encryptMessage(JSON.stringify(mediaData));
  }

  static decryptMediaData(encryptedData: { encrypted: string; iv: string }): any {
    const decrypted = this.decryptMessage(encryptedData);
    return JSON.parse(decrypted);
  }
}