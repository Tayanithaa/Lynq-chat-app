// Custom hook for managing messages
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Message } from '../services/apiService';
import MessageEncryption from '../utils/encryption';
import { getSocketConfig, getSocketUrl } from '../utils/socketConfig';
import { Storage } from '../utils/storage';

export const useMessages = (otherUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  
  // Get current user from auth context with simple differentiation
  const { user } = useAuth();
  
  // Create different user IDs for testing by checking URL or creating unique session
  const getCurrentUserId = useCallback(async (): Promise<string> => {
    try {
      // Check if there's a user parameter in URL (web only)
      const userParam = Storage.getURLParam('user');
      if (userParam) {
        return `${userParam}@example.com`;
      }
      
      // Create different users based on storage or random assignment
      let userId = await Storage.getItem('lynq-user-id');
      if (!userId) {
        // Generate user IDs for simple 1-on-1 - alternating between Person 1 and Person 2
        const random = Math.random();
        if (random < 0.5) {
          userId = 'person1@example.com';
        } else {
          userId = 'person2@example.com';
        }
        await Storage.setItem('lynq-user-id', userId);
      }
      console.log('🧑 Current user ID:', userId);
      return userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return user?.email || user?.uid || 'web-user@example.com';
    }
  }, [user]);

  // Initialize current user
  useEffect(() => {
    const initializeUser = async () => {
      const userId = await getCurrentUserId();
      setCurrentUser(userId);
    };
    initializeUser();
  }, [getCurrentUserId]);

  // Generate encryption key for this chat
  const getEncryptionKey = useCallback(() => {
    const users = ['person1@example.com', 'person2@example.com'];
    return MessageEncryption.generateUserKey(users[0], users[1]);
  }, []);

  // Test encryption on first load
  useEffect(() => {
    console.log('🔐 Testing encryption system...');
    MessageEncryption.test();
  }, []);

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

      // Decrypt messages if they are encrypted
      const encryptionKey = getEncryptionKey();
      const decryptedMessages = conversationMessages.map(msg => {
        if (msg.isEncrypted && msg.encryptedText) {
          const decryptedText = MessageEncryption.decrypt(msg.encryptedText, encryptionKey);
          return { ...msg, text: decryptedText };
        }
        return msg;
      });
      
      setMessages(decryptedMessages);
      console.log(`📋 Loaded ${decryptedMessages.length} messages for 1-on-1 chat (${conversationMessages.filter(m => m.isEncrypted).length} encrypted)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [getEncryptionKey]); // Added dependency for encryption key

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
      // Encrypt the message
      const encryptionKey = getEncryptionKey();
      const encryptedText = MessageEncryption.encrypt(text, encryptionKey);
      
      console.log(`📤 Sending encrypted message from ${currentUser} to ${receiver}: "${text}"`);
      
      // Send both plain text (for fallback) and encrypted text
      const newMessage = await apiService.sendMessage(currentUser, receiver, text, encryptedText, true);
      
      if (newMessage) {
        console.log('📤 Encrypted message sent successfully, waiting for Socket.io update');
        return true;
      } else {
        setError('Failed to send encrypted message');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send encrypted message');
      return false;
    }
  }, [currentUser, getEncryptionKey]); // Added getEncryptionKey dependency

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
        console.log('📨 Received encrypted message via Socket.io:', msg);
        
        // Decrypt message if it's encrypted
        let decryptedMessage = { ...msg };
        if (msg.isEncrypted && msg.encryptedText) {
          const encryptionKey = getEncryptionKey();
          const decryptedText = MessageEncryption.decrypt(msg.encryptedText, encryptionKey);
          decryptedMessage.text = decryptedText;
          console.log('🔓 Message decrypted successfully');
        }
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(m => m.id === decryptedMessage.id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', decryptedMessage.id);
            return prev;
          }
          console.log('✅ Adding new decrypted message to state:', decryptedMessage.id);
          return [...prev, decryptedMessage];
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
  }, [getEncryptionKey]); // Added getEncryptionKey dependency

  // Function to switch between users for testing
  const switchUser = useCallback(async () => {
    try {
      const currentUserId = await Storage.getItem('lynq-user-id');
      let newUserId;
      
      if (currentUserId === 'person1@example.com') {
        newUserId = 'person2@example.com';
      } else {
        newUserId = 'person1@example.com';
      }
      
      await Storage.setItem('lynq-user-id', newUserId);
      console.log(`🔄 Switched user from ${currentUserId} to ${newUserId}`);
      
      // Update the current user state
      setCurrentUser(newUserId);
      
      // Reload the page only on web platforms
      Storage.reloadPage();
    } catch (error) {
      console.error('Error switching user:', error);
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