// utils/socketConfig.ts
import { Platform } from 'react-native';

/**
 * Get the appropriate socket URL based on the platform
 */
export const getSocketUrl = (): string => {
  // Check if we're running in Expo development
  const isDev = __DEV__;
  
  // Get the base URL from environment variables
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Default URLs based on platform
  if (Platform.OS === 'web') {
    return 'http://localhost:3004';
  }
  
  // For mobile platforms
  if (isDev && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    // @ts-ignore - __DEV__ and global variables are available in Expo
    const bundlerHost = global?.location?.hostname || 
                       global?.window?.location?.hostname ||
                       'localhost';
    
    if (bundlerHost && bundlerHost !== 'localhost') {
      return `http://${bundlerHost}:3004`;
    }
  }
  
  // Fallback
  return 'http://localhost:3004';
};

/**
 * Socket configuration optimized for both mobile and web
 */
export const getSocketConfig = () => ({
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  forceNew: false,
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: true
});