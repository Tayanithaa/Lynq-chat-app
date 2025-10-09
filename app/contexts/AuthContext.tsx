// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebaseconfig';

// Explicitly type auth to handle both Firebase and mock implementations
const firebaseAuth: any = auth as any;

interface User {
  uid: string;
  email?: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During development, provide more helpful error info
    console.error('useAuth called outside of AuthProvider. Make sure the component is wrapped in AuthProvider.');
    console.error('Current AuthContext value:', context);
    console.error('Component stack trace at time of error:');
    console.trace();
    
    // In development, return a fallback instead of throwing
    if (__DEV__) {
      console.warn('🚨 Returning fallback auth context for development');
      return {
        user: null,
        isLoading: false,
        signIn: async () => { throw new Error('Auth not available'); },
        signOut: async () => { throw new Error('Auth not available'); },
        signUp: async () => { throw new Error('Auth not available'); },
      };
    }
    
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔧 AuthProvider initializing...');

  useEffect(() => {
    // Check if Firebase auth is available
    if (firebaseAuth && typeof firebaseAuth.onAuthStateChanged === 'function') {
      // Firebase is available
      const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser: any) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            displayName: firebaseUser.displayName || undefined,
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

      return unsubscribe;
    } else {
      // Firebase not available - create a default user for development
      console.log('🔧 Firebase auth not available, using default user for development');
      setUser({
        uid: 'dev-user-' + Date.now(),
        email: 'web-user@example.com',
        displayName: 'Development User',
      });
      setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (firebaseAuth && typeof firebaseAuth.signInWithEmailAndPassword === 'function') {
        // Use real Firebase auth
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        // Mock authentication for development
        console.log('🔧 Mock authentication - signing in user');
        setUser({
          uid: 'mock-user-' + Date.now(),
          email: email,
          displayName: email.split('@')[0],
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (firebaseAuth && typeof firebaseAuth.createUserWithEmailAndPassword === 'function') {
        // Use real Firebase auth
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        // Mock authentication for development
        console.log('🔧 Mock authentication - creating user');
        setUser({
          uid: 'new-user-' + Date.now(),
          email: email,
          displayName: email.split('@')[0],
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (firebaseAuth && typeof firebaseAuth.signOut === 'function') {
        await firebaseAuth.signOut();
      } else {
        // Mock sign out
        setUser(null);
      }
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

  console.log('🔧 AuthProvider rendering with value:', { user: user?.uid, isLoading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};