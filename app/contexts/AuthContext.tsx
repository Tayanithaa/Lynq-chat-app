// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Storage } from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3004';

interface User {
  uid: string;
  username: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔧 AuthProvider initializing...');

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const token = await Storage.getItem('lynq-auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        console.log('✅ Token validated, user logged in:', data.data.user.username);
      } else {
        await Storage.removeItem('lynq-auth-token');
        console.log('❌ Token invalid, user logged out');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      await Storage.removeItem('lynq-auth-token');
    } finally {
      setIsLoading(false);
    }
  };


  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 AuthContext signIn - calling API:', API_BASE_URL);
      console.log('📡 Using API URL:', `${API_BASE_URL}/api/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('📦 Login response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if we got the expected data structure
      if (!data.data || !data.data.user) {
        throw new Error('Invalid response from server');
      }

      await Storage.setItem('lynq-auth-token', data.data.user.sessionToken);
      console.log('💾 Token saved, setting user:', data.data.user);
      setUser({
        uid: data.data.user.username,
        username: data.data.user.username,
        displayName: data.data.user.username
      });
      
      console.log('✅ User logged in:', data.data.user.username);
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      // Provide helpful error messages for common issues
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure:\n1. Server is running (node simple-server.js)\n2. You\'re on the same WiFi network\n3. Check .env file has correct IP address');
      }
      
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName: displayName || username })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await Storage.setItem('lynq-auth-token', data.data.token);
      setUser(data.data.user);
      
      console.log('✅ User registered:', data.data.user.username);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await Storage.removeItem('lynq-auth-token');
      setUser(null);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    signUp,
  };

  console.log('🔧 AuthProvider rendering with value:', { user: user?.username, isLoading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};