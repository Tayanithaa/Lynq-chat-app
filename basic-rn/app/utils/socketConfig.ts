// Enhanced socket configuration with encryption support
import { Platform } from 'react-native';
import { EncryptionService } from './encryption';

export const getSocketConfig = () => {
  return {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  };
};

export const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';
  }
  
  // For mobile devices, use the computer's IP address
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.100:3004';
};

export class SocketMessageHandler {
  static encryptMessageForSocket(message: string, messageType: string = 'text') {
    try {
      const encryptedContent = EncryptionService.encryptMessage(message);
      return {
        message: message, // Plain text for real-time display
        encryptedContent, // Encrypted for storage
        messageType,
        encrypted: true
      };
    } catch (error) {
      console.error('Socket message encryption error:', error);
      return {
        message: message,
        messageType,
        encrypted: false
      };
    }
  }

  static decryptMessageFromSocket(messageData: any) {
    try {
      if (messageData.encryptedContent && messageData.encrypted) {
        const decryptedText = EncryptionService.decryptMessage(messageData.encryptedContent);
        return {
          ...messageData,
          message: decryptedText,
          decrypted: true
        };
      }
      return messageData;
    } catch (error) {
      console.error('Socket message decryption error:', error);
      return {
        ...messageData,
        message: '[Unable to decrypt message]',
        decryptionError: true
      };
    }
  }
}