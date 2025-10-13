// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export class Storage {
  static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  }

  // Helper method to check if we're in a web environment with localStorage
  static isLocalStorageAvailable(): boolean {
    return Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Helper method to reload the page (web only)
  static reloadPage(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  // Helper method to get URL parameters (web only)
  static getURLParam(param: string): string | null {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
    return null;
  }
}

export default Storage;