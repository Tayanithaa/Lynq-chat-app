import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { getSocketConfig, getSocketUrl, SocketMessageHandler } from '../utils/socketConfig';

interface Message {
  id: string;
  message: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  encrypted?: boolean;
  messageType?: string;
}

interface EnhancedChatScreenProps {
  currentUserId: string;
  otherUserId: string;
  roomId?: string;
}

export default function EnhancedChatScreen({ 
  currentUserId, 
  otherUserId, 
  roomId 
}: EnhancedChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const finalRoomId = roomId || [currentUserId, otherUserId].sort().join('-');

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUserId, otherUserId, finalRoomId]);

  const initializeSocket = () => {
    try {
      const socketUrl = getSocketUrl();
      const socketConfig = getSocketConfig();
      
      const newSocket = io(socketUrl, socketConfig);
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Join the chat room
        newSocket.emit('join-room', { roomId: finalRoomId });
        
        // Set user as online
        newSocket.emit('user-online', { userId: currentUserId });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('receive-message', (messageData) => {
        console.log('Received message:', messageData);
        
        // Decrypt message if encrypted
        const processedMessage = SocketMessageHandler.decryptMessageFromSocket(messageData);
        
        setMessages(prev => [...prev, processedMessage]);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      newSocket.on('user-typing', (data) => {
        if (data.userId !== currentUserId) {
          setOtherUserTyping(data.isTyping);
        }
      });

      newSocket.on('message-delivered', (data) => {
        console.log('Message delivered:', data.messageId);
        // Update message status
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, isDelivered: true }
              : msg
          )
        );
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        Alert.alert('Connection Error', 'Unable to connect to chat server');
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket initialization error:', error);
      Alert.alert('Error', 'Failed to initialize chat connection');
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !socket || !isConnected) return;

    const messageData = {
      id: Date.now().toString(),
      message: inputText.trim(),
      senderId: currentUserId,
      receiverId: otherUserId,
      roomId: finalRoomId,
      timestamp: new Date().toISOString(),
      messageType: 'text'
    };

    // Encrypt message for transmission
    const encryptedMessageData = SocketMessageHandler.encryptMessageForSocket(
      inputText.trim(), 
      'text'
    );

    // Add to local messages immediately
    setMessages(prev => [...prev, messageData]);

    // Send via socket
    socket.emit('send-message', {
      ...messageData,
      ...encryptedMessageData
    });

    setInputText('');
    stopTyping();
    
    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (text.length > 0 && !isTyping) {
      startTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000) as any;
    } else if (text.length === 0) {
      stopTyping();
    }
  };

  const startTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing-start', { 
        roomId: finalRoomId, 
        userId: currentUserId 
      });
    }
  };

  const stopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('typing-stop', { 
        roomId: finalRoomId, 
        userId: currentUserId 
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.otherMessageText
        ]}>
          {item.message}
        </Text>
        <View style={styles.messageInfo}>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {item.encrypted && (
            <Ionicons 
              name="shield-checkmark" 
              size={12} 
              color={isMyMessage ? '#ffffff80' : '#00000080'} 
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Chat - {otherUserId}
        </Text>
        <View style={styles.connectionStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {/* Typing indicator */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>User is typing...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            { opacity: inputText.trim() ? 1 : 0.5 }
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || !isConnected}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#666',
  },
  typingIndicator: {
    padding: 12,
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});