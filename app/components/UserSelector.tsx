// User Selector Component for Testing Real-Time Chat
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserSelectorProps {
  onUserSelected: (userId: string) => void;
  currentUser: string | null;
}

export default function UserSelector({ onUserSelected, currentUser }: UserSelectorProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(currentUser);

  const testUsers = [
    { id: 'alice@example.com', name: 'Alice', color: '#4CAF50' },
    { id: 'bob@example.com', name: 'Bob', color: '#2196F3' },
    { id: 'charlie@example.com', name: 'Charlie', color: '#FF9800' },
    { id: 'diana@example.com', name: 'Diana', color: '#E91E63' },
  ];

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    onUserSelected(userId);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('lynq-test-user-id', userId);
    }
    
    Alert.alert('User Selected', `You are now chatting as ${testUsers.find(u => u.id === userId)?.name}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Test User:</Text>
      <View style={styles.userGrid}>
        {testUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.userButton,
              { backgroundColor: user.color },
              selectedUser === user.id && styles.selectedUser
            ]}
            onPress={() => handleUserSelect(user.id)}
          >
            <Text style={styles.userName}>{user.name}</Text>
            {selectedUser === user.id && (
              <Text style={styles.selectedText}>✓ You</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedUser && (
        <View style={styles.currentUserDisplay}>
          <Text style={styles.currentUserText}>
            Currently chatting as: {testUsers.find(u => u.id === selectedUser)?.name}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
  },
  userButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedUser: {
    borderWidth: 3,
    borderColor: '#333',
  },
  userName: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  currentUserDisplay: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  currentUserText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#1976d2',
  },
});