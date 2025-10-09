import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { Alert, Platform } from 'react-native';

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  avatar?: string;
  isRegistered?: boolean;
}

export interface SyncedContact extends Contact {
  lastSeen?: string;
  status?: 'online' | 'offline' | 'busy';
  userId?: string;
}

class ContactService {
  private contacts: SyncedContact[] = [];
  private readonly CONTACTS_STORAGE_KEY = 'synced_contacts';

  /**
   * Request permissions and sync contacts from device
   */
  async requestPermissionsAndSync(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Feature Not Available',
          'Contact syncing is only available on mobile devices.'
        );
        return false;
      }

      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to sync your contacts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Contacts.requestPermissionsAsync() }
          ]
        );
        return false;
      }

      return await this.syncContacts();
    } catch (error) {
      console.error('Error requesting contact permissions:', error);
      return false;
    }
  }

  /**
   * Sync contacts from device
   */
  async syncContacts(): Promise<boolean> {
    try {
      console.log('🔄 Starting contact sync...');
      
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Image,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const syncedContacts: SyncedContact[] = data
        .filter(contact => contact.name && (contact.phoneNumbers?.length || contact.emails?.length))
        .map(contact => ({
          id: contact.id || Math.random().toString(36),
          name: contact.name || 'Unknown',
          phoneNumbers: contact.phoneNumbers?.map(p => p.number || p.digits || '') || [],
          emails: contact.emails?.map(e => e.email || '') || [],
          avatar: contact.imageAvailable ? contact.image?.uri : undefined,
          isRegistered: false, // Will be updated by backend check
          status: 'offline',
        }));

      this.contacts = syncedContacts;
      
      // Save to local storage
      await AsyncStorage.setItem(
        this.CONTACTS_STORAGE_KEY,
        JSON.stringify(syncedContacts)
      );

      console.log(`✅ Synced ${syncedContacts.length} contacts`);
      
      // Check which contacts are registered users
      await this.checkRegisteredUsers();
      
      return true;
    } catch (error) {
      console.error('Error syncing contacts:', error);
      return false;
    }
  }

  /**
   * Check which contacts are registered users in your app
   */
  async checkRegisteredUsers(): Promise<void> {
    try {
      const phoneNumbers = this.contacts.flatMap(c => c.phoneNumbers);
      const emails = this.contacts.flatMap(c => c.emails);
      
      // Call backend to check registered users
      const response = await fetch('http://localhost:3004/api/users/check-registered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers, emails }),
      });

      if (response.ok) {
        const { registeredContacts } = await response.json();
        
        // Update contacts with registration status
        this.contacts = this.contacts.map(contact => {
          const isRegistered = registeredContacts.some((reg: any) => 
            contact.phoneNumbers.includes(reg.phone) || 
            contact.emails.includes(reg.email)
          );
          return { ...contact, isRegistered };
        });

        // Save updated contacts
        await AsyncStorage.setItem(
          this.CONTACTS_STORAGE_KEY,
          JSON.stringify(this.contacts)
        );
      }
    } catch (error) {
      console.log('Note: Could not check registered users (backend may not be running)');
    }
  }

  /**
   * Get all synced contacts
   */
  async getContacts(): Promise<SyncedContact[]> {
    if (this.contacts.length === 0) {
      await this.loadFromStorage();
    }
    return this.contacts;
  }

  /**
   * Get only registered contacts
   */
  async getRegisteredContacts(): Promise<SyncedContact[]> {
    const contacts = await this.getContacts();
    return contacts.filter(c => c.isRegistered);
  }

  /**
   * Search contacts by name or phone/email
   */
  async searchContacts(query: string): Promise<SyncedContact[]> {
    const contacts = await this.getContacts();
    const lowercaseQuery = query.toLowerCase();
    
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      contact.phoneNumbers.some(phone => phone.includes(query)) ||
      contact.emails.some(email => email.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Load contacts from local storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.CONTACTS_STORAGE_KEY);
      if (stored) {
        this.contacts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading contacts from storage:', error);
    }
  }

  /**
   * Clear all synced contacts
   */
  async clearContacts(): Promise<void> {
    this.contacts = [];
    await AsyncStorage.removeItem(this.CONTACTS_STORAGE_KEY);
  }

  /**
   * Get contact by phone number
   */
  async getContactByPhone(phone: string): Promise<SyncedContact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.phoneNumbers.includes(phone)) || null;
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string): Promise<SyncedContact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.emails.includes(email)) || null;
  }

  /**
   * Update contact status (online/offline/busy)
   */
  updateContactStatus(contactId: string, status: 'online' | 'offline' | 'busy'): void {
    this.contacts = this.contacts.map(contact =>
      contact.id === contactId ? { ...contact, status } : contact
    );
  }
}

export const contactService = new ContactService();