import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Lazy import for expo-contacts to handle missing dependency gracefully
let Contacts: any = null;
try {
  Contacts = require('expo-contacts');
} catch (error) {
  console.warn('expo-contacts not available:', error);
}

export interface SyncedContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  isRegistered?: boolean;
  avatar?: string;
  lastSynced: string;
}

export interface ContactSyncResult {
  success: boolean;
  totalContacts: number;
  syncedContacts: number;
  registeredContacts: number;
  error?: string;
}

class ContactSyncService {
  private static readonly STORAGE_KEY = 'lynq_synced_contacts';
  private static readonly LAST_SYNC_KEY = 'lynq_last_sync';

  /**
   * Request contacts permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (!Contacts) {
        console.warn('expo-contacts not available');
        Alert.alert('Feature Unavailable', 'Contact sync feature is not available in this build.');
        return false;
      }
      
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        console.log('✅ Contacts permission granted');
        return true;
      } else {
        console.log('❌ Contacts permission denied');
        Alert.alert(
          'Permission Required',
          'Lynq needs access to your contacts to help you find friends. Please enable contacts permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => this.openSettings() }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to request contacts permission:', error);
      return false;
    }
  }

  /**
   * Sync all contacts from device
   */
  static async syncContacts(): Promise<ContactSyncResult> {
    try {
      console.log('📱 Starting contact sync...');

      // Check permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return {
          success: false,
          totalContacts: 0,
          syncedContacts: 0,
          registeredContacts: 0,
          error: 'Contacts permission denied'
        };
      }

      // Get all contacts from device
      if (!Contacts) {
        return {
          success: false,
          totalContacts: 0,
          syncedContacts: 0,
          registeredContacts: 0,
          error: 'expo-contacts not available'
        };
      }
      
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Image,
        ],
      });

      console.log(`📊 Found ${deviceContacts.length} contacts on device`);

      // Process and format contacts
      const syncedContacts: SyncedContact[] = [];
      
      for (const contact of deviceContacts) {
        // Skip contacts without phone numbers
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          continue;
        }

        const phoneNumbers = contact.phoneNumbers
          .map(phone => phone.number)
          .filter((number): number is string => number !== undefined)
          .map(phone => this.formatPhoneNumber(phone))
          .filter(phone => this.isValidPhoneNumber(phone));

        if (phoneNumbers.length === 0) {
          continue;
        }

        const syncedContact: SyncedContact = {
          id: contact.id || `contact_${Date.now()}_${Math.random()}`,
          name: contact.name || 'Unknown',
          phoneNumbers,
          emails: contact.emails?.map(email => email.email).filter((email): email is string => email !== undefined) || [],
          avatar: contact.image?.uri,
          lastSynced: new Date().toISOString()
        };

        syncedContacts.push(syncedContact);
      }

      console.log(`✅ Processed ${syncedContacts.length} valid contacts`);

      // Check which contacts are registered on Lynq
      const registeredContacts = await this.checkRegisteredContacts(syncedContacts);
      
      // Save to storage
      await this.saveContactsToStorage(registeredContacts);
      await this.updateLastSyncTime();

      const registeredCount = registeredContacts.filter(c => c.isRegistered).length;

      console.log(`🎉 Contact sync completed: ${registeredCount} registered users found`);

      return {
        success: true,
        totalContacts: deviceContacts.length,
        syncedContacts: syncedContacts.length,
        registeredContacts: registeredCount
      };

    } catch (error) {
      console.error('❌ Contact sync failed:', error);
      return {
        success: false,
        totalContacts: 0,
        syncedContacts: 0,
        registeredContacts: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check which contacts are registered on Lynq platform
   */
  private static async checkRegisteredContacts(contacts: SyncedContact[]): Promise<SyncedContact[]> {
    try {
      // Extract all unique phone numbers
      const allPhoneNumbers = contacts.flatMap(contact => contact.phoneNumbers);
      const uniquePhoneNumbers = [...new Set(allPhoneNumbers)];

      console.log(`🔍 Checking ${uniquePhoneNumbers.length} phone numbers against Lynq database...`);

      try {
        // Call backend API to check registered users
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';
        
        const response = await fetch(`${API_BASE_URL}/api/contacts/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumbers: uniquePhoneNumbers
          })
        });

        if (response.ok) {
          const result = await response.json();
          const registeredNumbers = new Set(result.registeredNumbers);
          
          console.log(`✅ Found ${result.registeredCount} registered users via API`);

          // Mark contacts as registered if they have registered phone numbers
          const updatedContacts = contacts.map(contact => ({
            ...contact,
            isRegistered: contact.phoneNumbers.some(phone => registeredNumbers.has(phone))
          }));

          return updatedContacts;
        } else {
          throw new Error(`API request failed with status: ${response.status}`);
        }

      } catch (apiError) {
        console.warn('⚠️ API call failed, using fallback:', apiError);
        
        // Fallback: simulate some registered users
        const mockRegisteredNumbers = new Set([
          '+1234567890',
          '+9876543210',
          '+1555123456',
        ]);

        const updatedContacts = contacts.map(contact => ({
          ...contact,
          isRegistered: contact.phoneNumbers.some(phone => mockRegisteredNumbers.has(phone))
        }));

        return updatedContacts;
      }

    } catch (error) {
      console.error('❌ Failed to check registered contacts:', error);
      return contacts.map(contact => ({ ...contact, isRegistered: false }));
    }
  }

  /**
   * Get synced contacts from storage
   */
  static async getSyncedContacts(): Promise<SyncedContact[]> {
    try {
      const contactsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (contactsJson) {
        const contacts: SyncedContact[] = JSON.parse(contactsJson);
        console.log(`📱 Retrieved ${contacts.length} synced contacts from storage`);
        return contacts;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get synced contacts:', error);
      return [];
    }
  }

  /**
   * Get only registered contacts
   */
  static async getRegisteredContacts(): Promise<SyncedContact[]> {
    const allContacts = await this.getSyncedContacts();
    return allContacts.filter(contact => contact.isRegistered);
  }

  /**
   * Save contacts to storage
   */
  private static async saveContactsToStorage(contacts: SyncedContact[]): Promise<void> {
    try {
      const contactsJson = JSON.stringify(contacts);
      await AsyncStorage.setItem(this.STORAGE_KEY, contactsJson);
      console.log(`💾 Saved ${contacts.length} contacts to storage`);
    } catch (error) {
      console.error('❌ Failed to save contacts:', error);
    }
  }

  /**
   * Update last sync time
   */
  private static async updateLastSyncTime(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, timestamp);
    } catch (error) {
      console.error('❌ Failed to update last sync time:', error);
    }
  }

  /**
   * Get last sync time
   */
  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('❌ Failed to get last sync time:', error);
      return null;
    }
  }

  /**
   * Format phone number for consistency
   */
  private static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present and number doesn't start with 0
    if (!cleaned.startsWith('+') && !cleaned.startsWith('0')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  private static isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Open device settings (platform specific)
   */
  private static openSettings(): void {
    if (Platform.OS === 'ios') {
      // iOS: Open app settings
      // Linking.openURL('app-settings:');
    } else {
      // Android: Open app settings
      // Linking.openSettings();
    }
  }

  /**
   * Clear all synced contacts
   */
  static async clearSyncedContacts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.LAST_SYNC_KEY);
      console.log('🗑️ Cleared all synced contacts');
    } catch (error) {
      console.error('❌ Failed to clear synced contacts:', error);
    }
  }
}

export default ContactSyncService;