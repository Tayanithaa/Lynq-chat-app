import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiService } from './services/apiService';

const MessageTest = () => {
  const [sender, setSender] = useState('test_user@example.com');
  const [receiver, setReceiver] = useState('friend@example.com');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const testSendMessage = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.sendMessage(sender, receiver, text.trim());
      
      if (result) {
        Alert.alert('Success!', `Message sent: ${result.id || 'No ID'}`);
        setText('');
      } else {
        Alert.alert('Failed', 'Could not send message');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    try {
      const isHealthy = await apiService.healthCheck();
      Alert.alert('Health Check', isHealthy ? 'Backend is healthy!' : 'Backend is down');
    } catch (error) {
      Alert.alert('Health Check Failed', error.message || 'Cannot reach backend');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message Testing</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Sender email"
        value={sender}
        onChangeText={setSender}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Receiver email"
        value={receiver}
        onChangeText={setReceiver}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Message text"
        value={text}
        onChangeText={setText}
        multiline
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testSendMessage}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Test Message'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.healthButton} onPress={testHealth}>
        <Text style={styles.buttonText}>Test Backend Health</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  healthButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default MessageTest;