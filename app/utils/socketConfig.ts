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
  
  // Default to environment-provided URL (set by EAS) or the deployed Railway URL
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_SOCKET_URL || 'https://lynq-chat-app-production.up.railway.app';
  }

  // For mobile platforms, prefer the bundled env or the deployed backend
  if (isDev && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    // In dev you may still want to connect to the local bundler host. If so,
    // set EXPO_PUBLIC_SOCKET_URL in your env or use a LAN IP. Otherwise the
    // deployed Railway URL will be used.
    const env = process.env.EXPO_PUBLIC_SOCKET_URL;
    if (env) return env;
  }

  // Fallback to deployed backend
  return 'https://lynq-chat-app-production.up.railway.app';
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