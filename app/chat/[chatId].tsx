import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useMessages } from '../hooks/useMessages';
import { Message } from '../services/apiService';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const {
    messages,
    loading,
    error,
    currentUser,
    sendMessage,
    refreshMessages,
    checkHealth,
    switchUser,
  } = useMessages(chatId as string);

  // Get user display name
  const getUserDisplayName = (userId: string) => {
    if (!userId) return 'Unknown User';
    
    // If it's the current user, show "You"
    if (userId === currentUser) {
      return 'You';
    }
    
    // For named users, show proper names
    if (userId.includes('alice')) return 'Alice';
    if (userId.includes('bob')) return 'Bob';
    if (userId.includes('charlie')) return 'Charlie';
    if (userId.includes('person1')) return 'Person 1';
    if (userId.includes('person2')) return 'Person 2';
    if (userId.includes('friend')) return 'Friend';
    
    // Extract username from email format
    const username = userId.split('@')[0] || 'User';
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        Alert.alert(
          'Backend Connection',
          'Unable to connect to the chat server. Please make sure the backend is running.',
          [{ text: 'OK' }]
        );
      }
    };
    checkBackend();
  }, [checkHealth]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const success = await sendMessage(messageText.trim());
    if (success) {
      setMessageText('');
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  // Render individual message - WhatsApp style
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUser;
    const displayName = getUserDisplayName(item.senderId || 'unknown');
    
    console.log(`Message from ${item.senderId}, current user: ${currentUser}, isMyMessage: ${isMyMessage}`);
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>{displayName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isMyMessage ? styles.myTimestamp : styles.otherTimestamp
            ]}>
              {new Date(item.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            {isMyMessage && (
              <Text style={styles.checkMark}>✓✓</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Chat with {chatId}</Text>
          <Text style={styles.userInfo}>You are: {currentUser}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={switchUser} style={styles.switchButton}>
            <Text style={styles.switchText}>Switch User</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshMessages} style={styles.refreshButton}>
            <Text style={styles.refreshText}>⟳</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading messages...' : 'No messages yet. Start the conversation!'}
            </Text>
          </View>
        }
      />

      {/* Message input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            { opacity: messageText.trim() ? 1 : 0.5 }
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: '#007bff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 20,
    color: 'white',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    minWidth: '20%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  myBubble: {
    backgroundColor: '#DCF8C6', // WhatsApp green
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#000',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  myTimestamp: {
    color: '#666',
  },
  otherTimestamp: {
    color: '#999',
  },
  checkMark: {
    fontSize: 12,
    color: '#4FC3F7',
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
  },
  switchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
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
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});