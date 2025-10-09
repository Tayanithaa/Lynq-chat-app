import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import EnhancedChatScreen from '../components/EnhancedChatScreen';

export default function TestChatScreen() {
  const [currentUserId, setCurrentUserId] = useState('user1');
  const [otherUserId, setOtherUserId] = useState('user2');
  const [showChat, setShowChat] = useState(false);

  const startChat = () => {
    if (!currentUserId.trim() || !otherUserId.trim()) {
      Alert.alert('Error', 'Please enter both user IDs');
      return;
    }
    
    if (currentUserId === otherUserId) {
      Alert.alert('Error', 'User IDs must be different');
      return;
    }

    setShowChat(true);
  };

  if (showChat) {
    return (
      <EnhancedChatScreen
        currentUserId={currentUserId}
        otherUserId={otherUserId}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚀 Lynq Chat Test</Text>
        <Text style={styles.subtitle}>
          Test the encrypted real-time messaging system
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your User ID:</Text>
          <TextInput
            style={styles.input}
            value={currentUserId}
            onChangeText={setCurrentUserId}
            placeholder="Enter your user ID"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Other User ID:</Text>
          <TextInput
            style={styles.input}
            value={otherUserId}
            onChangeText={setOtherUserId}
            placeholder="Enter other user ID"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.startButton} onPress={startChat}>
          <Text style={styles.startButtonText}>Start Encrypted Chat 🔒</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Features:</Text>
          <Text style={styles.infoText}>• AES Encryption for all messages</Text>
          <Text style={styles.infoText}>• Real-time messaging via Socket.IO</Text>
          <Text style={styles.infoText}>• Typing indicators</Text>
          <Text style={styles.infoText}>• Message delivery status</Text>
          <Text style={styles.infoText}>• Cross-platform support</Text>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});