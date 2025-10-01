// API service for backend communication
import { auth } from '../config/firebaseconfig';

// Read backend URL from environment (Expo/.env)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';

// Types for message data
export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
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
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
      const response: MessageResponse = await this.makeRequest('/api/messages');
      return response.messages || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  // Send a new message
  async sendMessage(sender: string, receiver: string, text: string): Promise<Message | null> {
    try {
      const response: SendMessageResponse = await this.makeRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ sender, receiver, text }),
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  // Get messages between two users
  async getConversation(user1: string, user2: string): Promise<Message[]> {
    try {
      const allMessages = await this.getMessages();
      return allMessages.filter(msg => 
        (msg.sender === user1 && msg.receiver === user2) ||
        (msg.sender === user2 && msg.receiver === user1)
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