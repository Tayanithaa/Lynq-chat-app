// Custom hook for managing messages
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebaseconfig';
import { apiService, Message } from '../services/apiService';

export const useMessages = (otherUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Get current user info
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user.email || user.uid);
    }
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let messagesData: Message[];
      
      if (otherUserId && currentUser) {
        // Get conversation between current user and specific user
        messagesData = await apiService.getConversation(currentUser, otherUserId);
      } else {
        // Get all messages
        messagesData = await apiService.getMessages();
      }
      
      setMessages(messagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [otherUserId, currentUser]);

  // Send a message
  const sendMessage = useCallback(async (text: string, receiverId?: string) => {
    if (!currentUser) {
      setError('No user logged in');
      return false;
    }

    const receiver = receiverId || otherUserId;
    if (!receiver) {
      setError('No receiver specified');
      return false;
    }

    setError(null);
    
    try {
      const newMessage = await apiService.sendMessage(currentUser, receiver, text);
      
      if (newMessage) {
        // Add the new message to the local state
        setMessages(prev => [...prev, newMessage]);
        return true;
      } else {
        setError('Failed to send message');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [currentUser, otherUserId]);

  // Check backend health
  const checkHealth = useCallback(async () => {
    return await apiService.healthCheck();
  }, []);

  // Auto-load messages when hook is used
  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [loadMessages, currentUser]);

  // Setup socket connection for real-time updates
  useEffect(() => {
    const setupSocket = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';
      socketRef.current = io(apiUrl, { transports: ['websocket', 'polling'] });

      socketRef.current.on('connect', () => {
        console.log('🔌 Socket connected:', socketRef.current?.id);
      });

      socketRef.current.on('message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });
    };

    setupSocket();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    messages,
    loading,
    error,
    currentUser,
    sendMessage,
    refreshMessages: loadMessages,
    checkHealth,
  };
};