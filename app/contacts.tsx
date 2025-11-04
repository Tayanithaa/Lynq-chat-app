import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './contexts/AuthContext';
import { useOnlineUsers } from './hooks/useOnlineUsers';
import { callingService } from './services/callingService';
import { contactService, SyncedContact } from './services/contactService';

const ContactsScreen = () => {
  const [contacts, setContacts] = useState<SyncedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<SyncedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);
  const { user } = useAuth();
  const username = user?.username;
  const onlineUsers = useOnlineUsers(username);

  useEffect(() => {
    loadContacts();
  }, []);

  const filterContacts = useCallback(() => {
    let filtered = contacts;

    if (showOnlyRegistered) {
      filtered = filtered.filter(contact => contact.isRegistered);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumbers.some(phone => phone.includes(searchQuery)) ||
        contact.emails.some(email => email.toLowerCase().includes(query))
      );
    }

    // Mark registered contacts also as online if username matches presence list
    const withPresence = filtered.map((c) => ({
      ...c,
      isOnline: c.isRegistered && onlineUsers.includes(c.id || c.name || '')
    }));
    setFilteredContacts(withPresence);
  }, [contacts, searchQuery, showOnlyRegistered, onlineUsers]);

  useEffect(() => {
    filterContacts();
  }, [filterContacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const syncedContacts = await contactService.getContacts();
      setContacts(syncedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const syncContacts = async () => {
    try {
      setRefreshing(true);
      const success = await contactService.requestPermissionsAndSync();
      if (success) {
        await loadContacts();
        Alert.alert('Success', 'Contacts synced successfully');
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      Alert.alert('Error', 'Failed to sync contacts');
    } finally {
      setRefreshing(false);
    }
  };

  

  const initiateVoiceCall = async (contact: SyncedContact) => {
    if (!user || !contact.isRegistered) {
      Alert.alert('Cannot Call', 'This contact is not registered on Lynq');
      return;
    }

    try {
      await callingService.makeVoiceCall(
        contact.id,
        contact.name,
        user.uid,
        user.displayName || 'Unknown'
      );
      Alert.alert('Calling...', `Voice call initiated to ${contact.name}`);
    } catch (error) {
      console.error('Error initiating voice call:', error);
      Alert.alert('Call Failed', 'Failed to initiate voice call');
    }
  };

  const initiateVideoCall = async (contact: SyncedContact) => {
    if (!user || !contact.isRegistered) {
      Alert.alert('Cannot Call', 'This contact is not registered on Lynq');
      return;
    }

    try {
      await callingService.makeVideoCall(
        contact.id,
        contact.name,
        user.uid,
        user.displayName || 'Unknown'
      );
      Alert.alert('Calling...', `Video call initiated to ${contact.name}`);
    } catch (error) {
      console.error('Error initiating video call:', error);
      Alert.alert('Call Failed', 'Failed to initiate video call');
    }
  };

  const startChat = (contact: SyncedContact) => {
    if (!contact.isRegistered) {
      Alert.alert('Cannot Chat', 'This contact is not registered on Lynq');
      return;
    }

    // Navigate to chat screen with contact
    router.push({
      pathname: '/chat/[chatId]',
      params: { chatId: contact.id, contactName: contact.name }
    });
  };

  const renderContact = ({ item }: { item: SyncedContact & { isOnline?: boolean } }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => startChat(item)}>
      <View style={styles.contactInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>
            {item.phoneNumbers[0] || item.emails[0] || 'No contact info'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: item.isRegistered ? (item.isOnline ? '#00E676' : '#4CAF50') : '#9E9E9E' }
            ]} />
            <Text style={styles.statusText}>
              {item.isRegistered ? (item.isOnline ? 'Online' : 'On Lynq') : 'Not registered'}
            </Text>
          </View>
        </View>
      </View>

      {item.isRegistered && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => initiateVoiceCall(item)}
          >
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => initiateVideoCall(item)}
          >
            <Ionicons name="videocam" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => startChat(item)}
          >
            <Ionicons name="chatbubble" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <TouchableOpacity style={styles.syncButton} onPress={syncContacts}>
          <Ionicons name="sync" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showOnlyRegistered && styles.filterButtonActive]}
          onPress={() => setShowOnlyRegistered(!showOnlyRegistered)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={showOnlyRegistered ? "#FFF" : "#757575"} 
          />
          <Text style={[
            styles.filterText, 
            showOnlyRegistered && styles.filterTextActive
          ]}>
            Lynq Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredContacts.length} contacts
          {showOnlyRegistered && ` • ${contacts.filter(c => c.isRegistered).length} on Lynq`}
        </Text>
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={syncContacts} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No contacts found</Text>
            <Text style={styles.emptySubtitle}>
              {contacts.length === 0 
                ? "Tap the sync button to import your contacts"
                : "Try adjusting your search or filters"
              }
            </Text>
            {contacts.length === 0 && (
              <TouchableOpacity style={styles.syncContactsButton} onPress={syncContacts}>
                <Text style={styles.syncContactsButtonText}>Sync Contacts</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  syncButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#757575',
  },
  filterTextActive: {
    color: '#FFF',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#757575',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#757575',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
  },
  syncContactsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  syncContactsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactsScreen;