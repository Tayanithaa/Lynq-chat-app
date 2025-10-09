import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ContactSyncService, { SyncedContact, ContactSyncResult } from './services/contactSyncService';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<SyncedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStats, setSyncStats] = useState<ContactSyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    loadContacts();
    loadLastSyncTime();
  }, []);

  const loadContacts = async () => {
    try {
      const syncedContacts = await ContactSyncService.getSyncedContacts();
      setContacts(syncedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const lastSync = await ContactSyncService.getLastSyncTime();
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  };

  const handleSyncContacts = async () => {
    setLoading(true);
    try {
      const result = await ContactSyncService.syncContacts();
      setSyncStats(result);
      
      if (result.success) {
        await loadContacts();
        await loadLastSyncTime();
        
        Alert.alert(
          'Sync Complete!',
          `Found ${result.registeredContacts} friends on Lynq out of ${result.syncedContacts} contacts.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sync Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const formatLastSyncTime = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const renderContact = ({ item }: { item: SyncedContact }) => (
    <TouchableOpacity style={styles.contactItem}>
      <View style={styles.contactAvatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.isRegistered && (
          <View style={styles.registeredBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>
          {item.phoneNumbers[0]}
          {item.phoneNumbers.length > 1 && (
            <Text style={styles.additionalNumbers}>
              {' '}+{item.phoneNumbers.length - 1} more
            </Text>
          )}
        </Text>
        {item.isRegistered && (
          <Text style={styles.onLynqText}>On Lynq</Text>
        )}
      </View>
      
      <View style={styles.contactActions}>
        {item.isRegistered ? (
          <TouchableOpacity style={styles.chatButton}>
            <Ionicons name="chatbubble" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.inviteButton}>
            <Ionicons name="person-add" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const registeredContacts = contacts.filter(c => c.isRegistered);
  const unregisteredContacts = contacts.filter(c => !c.isRegistered);

  return (
    <LinearGradient
      colors={['#34e89e', '#0f3443']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Contacts</Text>
        <Text style={styles.subtitle}>
          {registeredContacts.length} friends on Lynq
        </Text>
        <Text style={styles.lastSync}>
          Last sync: {formatLastSyncTime(lastSyncTime)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.syncButton, loading && styles.syncButtonDisabled]}
        onPress={handleSyncContacts}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="refresh" size={20} color="#fff" />
        )}
        <Text style={styles.syncButtonText}>
          {loading ? 'Syncing...' : 'Sync Contacts'}
        </Text>
      </TouchableOpacity>

      {syncStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            📱 {syncStats.totalContacts} total • 
            ✅ {syncStats.syncedContacts} valid • 
            👥 {syncStats.registeredContacts} on Lynq
          </Text>
        </View>
      )}

      <FlatList
        data={[...registeredContacts, ...unregisteredContacts]}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#f0f0f0',
    marginBottom: 5,
  },
  lastSync: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  statsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactAvatar: {
    position: 'relative',
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  registeredBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  additionalNumbers: {
    fontSize: 12,
    color: '#999',
  },
  onLynqText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  contactActions: {
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#34e89e',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});