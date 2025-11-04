// API service for backend communication
import { auth } from '../config/firebaseconfig';

// Read backend URL from environment (Expo/.env)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lynq-chat-app-production.up.railway.app';

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
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      console.log('📡 Making API request to:', fullUrl);
      console.log('📦 Request options:', options);
      
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using auth token');
      } else {
        console.log('⚠️ No auth token available');
      }

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      console.log('📈 Response status:', response.status);
      console.log('📋 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const jsonResponse = await response.json();
      console.log('✅ Response data:', jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('❌ API request failed:', error);
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
    console.log('🔄 Attempting to send message:', { sender, receiver, text });
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    try {
      // Try authenticated endpoint first
      console.log('📡 Trying authenticated endpoint: /api/messages');
      const response: SendMessageResponse = await this.makeRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ 
          senderId: sender, 
          receiverId: receiver, 
          text 
        }),
      });
      
      console.log('✅ Authenticated endpoint success:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Authenticated endpoint failed:', error);
      console.log('🔄 Trying test endpoint: /api/messages/test');
      
      // Fallback to test endpoint without authentication
      try {
        const response: SendMessageResponse = await this.makeRequest('/api/messages/test', {
          method: 'POST',
          body: JSON.stringify({ 
            senderId: sender, 
            receiverId: receiver, 
            text 
          }),
        });
        
        console.log('✅ Test endpoint success:', response);
        return response.message || response.data;
      } catch (testError) {
        console.error('❌ Test endpoint also failed:', testError);
        return null;
      }
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

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<any> {
    console.log('📱 Sending OTP to:', phoneNumber);
    
    try {
      const response = await this.makeRequest('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber })
      });
      
      console.log('✅ OTP sent successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send OTP: ${errorMessage}`);
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber: string, otp: string): Promise<any> {
    console.log('🔐 Verifying OTP for:', phoneNumber);
    
    try {
      const response = await this.makeRequest('/api/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, otp })
      });
      
      console.log('✅ OTP verified successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to verify OTP: ${errorMessage}`);
    }
  }

  // Resend OTP
  async resendOTP(phoneNumber: string): Promise<any> {
    console.log('🔄 Resending OTP to:', phoneNumber);
    
    try {
      const response = await this.makeRequest('/api/otp/resend', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber })
      });
      
      console.log('✅ OTP resent successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to resend OTP:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to resend OTP: ${errorMessage}`);
    }
  }
}

export const apiService = new ApiService();