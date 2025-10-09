// Custom hook for managing messages
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Message } from '../services/apiService';
import { getSocketConfig, getSocketUrl } from '../utils/socketConfig';

export const useMessages = (otherUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Get current user from auth context with simple differentiation
  const { user } = useAuth();
  
  // Create different user IDs for testing by checking URL or creating unique session
  const getCurrentUserId = () => {
    if (typeof window !== 'undefined') {
      // Check if there's a user parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      if (userParam) {
        return `${userParam}@example.com`;
      }
      
      // Create different users based on localStorage or random assignment
      let userId = localStorage.getItem('lynq-user-id');
      if (!userId) {
        // Generate user IDs for simple 1-on-1 - alternating between Person 1 and Person 2
        const random = Math.random();
        if (random < 0.5) {
          userId = 'person1@example.com';
        } else {
          userId = 'person2@example.com';
        }
        localStorage.setItem('lynq-user-id', userId);
      }
      console.log('🧑 Current user ID:', userId);
      return userId;
    }
    return user?.email || user?.uid || 'web-user@example.com';
  };
  
  const currentUser = getCurrentUserId();

  // Load messages
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For 1-on-1 chat, get all messages and filter to show conversation
      // between person1@example.com and person2@example.com
      const allMessages = await apiService.getMessages();
      
      // Filter to show messages between Person 1 and Person 2 only
      const conversationMessages = allMessages.filter(msg => 
        (msg.senderId === 'person1@example.com' || msg.senderId === 'person2@example.com') &&
        (msg.receiverId === 'person1@example.com' || msg.receiverId === 'person2@example.com')
      );
      
      setMessages(conversationMessages);
      console.log(`📋 Loaded ${conversationMessages.length} messages for 1-on-1 chat`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []); // No dependency on currentUser since we filter by person1/person2 directly

  // Send a message
  const sendMessage = useCallback(async (text: string, receiverId?: string) => {
    if (!currentUser) {
      console.log('⚠️ No user available, using fallback');
      setError('Please refresh the page to load user authentication');
      return false;
    }

    // For simple 1-on-1 chat: Person 1 sends to Person 2, Person 2 sends to Person 1
    let receiver = receiverId;
    if (!receiver) {
      if (currentUser === 'person1@example.com') {
        receiver = 'person2@example.com';
      } else if (currentUser === 'person2@example.com') {
        receiver = 'person1@example.com';
      } else {
        receiver = 'person2@example.com'; // Default fallback
      }
    }

    setError(null);
    
    try {
      console.log(`📤 Sending message from ${currentUser} to ${receiver}: "${text}"`);
      const newMessage = await apiService.sendMessage(currentUser, receiver, text);
      
      if (newMessage) {
        console.log('📤 Message sent successfully, waiting for Socket.io update');
        return true;
      } else {
        setError('Failed to send message');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [currentUser]);

  // Check backend health
  const checkHealth = useCallback(async () => {
    return await apiService.healthCheck();
  }, []);

  // Auto-load messages when hook is used
  useEffect(() => {
    if (currentUser) {
      console.log('🔄 Loading messages for user:', currentUser);
      loadMessages();
    }
  }, [loadMessages, currentUser]);

  // Refresh messages periodically to ensure sync (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser) {
        console.log('🔄 Periodic message refresh');
        loadMessages();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [loadMessages, currentUser]);

  // Setup socket connection for real-time updates
  useEffect(() => {
    const setupSocket = async () => {
      const socketUrl = getSocketUrl();
      const socketConfig = getSocketConfig();
      
      console.log(`🔌 Setting up socket connection to: ${socketUrl}`);
      
      // Enhanced socket configuration for mobile and web
      socketRef.current = io(socketUrl, socketConfig);

      socketRef.current.on('connect', () => {
        console.log('🔌 Socket connected:', socketRef.current?.id);
      });

      socketRef.current.on('message', (msg: Message) => {
        console.log('📨 Received message via Socket.io:', msg);
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(m => m.id === msg.id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', msg.id);
            return prev;
          }
          console.log('✅ Adding new message to state:', msg.id);
          return [...prev, msg];
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
      });
    };

    setupSocket();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Function to switch between users for testing
  const switchUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const currentUserId = localStorage.getItem('lynq-user-id');
      let newUserId;
      
      if (currentUserId === 'person1@example.com') {
        newUserId = 'person2@example.com';
      } else {
        newUserId = 'person1@example.com';
      }
      
      localStorage.setItem('lynq-user-id', newUserId);
      console.log(`🔄 Switched user from ${currentUserId} to ${newUserId}`);
      
      // Reload the page to reflect the user change
      window.location.reload();
    }
  }, []);

  return {
    messages,
    loading,
    error,
    currentUser,
    sendMessage,
    refreshMessages: loadMessages,
    checkHealth,
    switchUser,
  };
};