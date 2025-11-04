// Custom hook for managing messages
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Message } from '../services/apiService';
import MessageEncryption from '../utils/encryption';
import { getSocketConfig, getSocketUrl } from '../utils/socketConfig';
// Storage import removed: no default personas in real-user mode

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
    // Require authenticated user; no default personas
    if (user?.username) return user.username;
    throw new Error('Not authenticated');
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
    // Derive deterministic key from the two participants
    const a = currentUser || '';
    const b = (otherUserId as string) || '';
    if (!a || !b) return MessageEncryption.generateUserKey('default', 'fallback');
    return MessageEncryption.generateUserKey(a, b);
  }, [currentUser, otherUserId]);

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
      // Get all messages and filter to just this conversation (currentUser <-> otherUserId)
      const allMessages = await apiService.getMessages();
      const conversationMessages = otherUserId && currentUser
        ? allMessages.filter(msg =>
            (msg.senderId === currentUser && msg.receiverId === otherUserId) ||
            (msg.senderId === otherUserId && msg.receiverId === currentUser)
          )
        : allMessages;

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
  }, [getEncryptionKey, currentUser, otherUserId]);

  // Send a message
  const sendMessage = useCallback(async (text: string, receiverId?: string) => {
    if (!currentUser) {
      setError('Not authenticated');
      return false;
    }

    // Resolve receiver: use provided otherUserId or argument
    const receiver = receiverId || (otherUserId as string);
    if (!receiver) {
      setError('No receiver selected');
      return false;
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
  }, [currentUser, getEncryptionKey, otherUserId]);

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
        // Identify this user for presence tracking
        if (currentUser) {
          socketRef.current?.emit('join', currentUser);
        }
      });

      const handleIncoming = (msg: Message) => {
        console.log('📨 Received message via Socket.io:', msg);
        
        // IMPORTANT: Only process messages for this conversation
        const isForThisChat = 
          (msg.senderId === currentUser && msg.receiverId === otherUserId) ||
          (msg.senderId === otherUserId && msg.receiverId === currentUser);
        
        if (!isForThisChat) {
          console.log('⏭️ Message not for this conversation, skipping');
          return;
        }
        
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
          console.log('✅ Adding new message to state:', decryptedMessage.id);
          return [...prev, decryptedMessage];
        });
      };

      // Support multiple server event names
      socketRef.current.on('message', handleIncoming);
      socketRef.current.on('new-message', handleIncoming);
      socketRef.current.on('receive-message', (payload: any) => {
        // Normalize payload shape if coming from room-based event
        if (payload?.message) handleIncoming(payload.message);
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
  }, [getEncryptionKey, currentUser, otherUserId]);

  // Function to switch between users for testing
  // Deprecated: no default personas switching in real-user mode
  const switchUser = useCallback(async () => {
    console.warn('Switch user is disabled. Please sign out and sign in with a different account.');
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