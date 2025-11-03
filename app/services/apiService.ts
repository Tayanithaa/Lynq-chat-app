// API service for backend communication
import { Storage } from '../utils/storage';

// Read backend URL from environment (Expo/.env)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';

// Types for message data
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  encryptedText?: string; // Store encrypted version
  timestamp: string;
  isEncrypted?: boolean; // Flag to indicate if message is encrypted
}

export interface MessageResponse {
  success: boolean;
  messages: Message[];
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('lynq-auth-token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all messages
  async getMessages(): Promise<Message[]> {
    try {
      // Try authenticated endpoint first
      const response: MessageResponse = await this.makeRequest('/api/messages');
      return response.messages || [];
    } catch (error) {
      console.error('Failed to fetch messages with auth, trying test endpoint:', error);
      
      // Fallback to test endpoint without authentication
      try {
        const response: MessageResponse = await this.makeRequest('/api/messages/test');
        return response.messages || [];
      } catch (testError) {
        console.error('Failed to fetch messages via test endpoint:', testError);
        return [];
      }
    }
  }

  // Send a new message
  async sendMessage(sender: string, receiver: string, text: string, encryptedText?: string, isEncrypted?: boolean): Promise<Message | null> {
    try {
      // Try authenticated endpoint first
      const response: SendMessageResponse = await this.makeRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ 
          senderId: sender, 
          receiverId: receiver, 
          text,
          encryptedText,
          isEncrypted: isEncrypted || false
        }),
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to send message with auth, trying test endpoint:', error);
      
      // Fallback to test endpoint without authentication
      try {
        const response: SendMessageResponse = await this.makeRequest('/api/messages/test', {
          method: 'POST',
          body: JSON.stringify({ 
            senderId: sender, 
            receiverId: receiver, 
            text,
            encryptedText,
            isEncrypted: isEncrypted || false
          }),
        });
        
        return response.data || null;
      } catch (testError) {
        console.error('Failed to send message via test endpoint:', testError);
        return null;
      }
    }
  }

  // Get messages between two users
  async getConversation(user1: string, user2: string): Promise<Message[]> {
    try {
      const allMessages = await this.getMessages();
      return allMessages.filter(msg => 
        (msg.senderId === user1 && msg.receiverId === user2) ||
        (msg.senderId === user2 && msg.receiverId === user1)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/health');
      return true;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();