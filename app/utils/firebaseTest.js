// Test Firebase Configuration
import { auth, db } from '../config/firebaseconfig';
import { signInAnonymously } from 'firebase/auth';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firebase config
    console.log('Firebase App:', auth.app.name);
    console.log('Firebase Project ID:', auth.app.options.projectId);
    
    // Test anonymous authentication (doesn't require user input)
    const result = await signInAnonymously(auth);
    console.log('Firebase Auth Test: SUCCESS');
    console.log('Anonymous User ID:', result.user.uid);
    
    // Test Firestore
    console.log('Firestore instance:', db.app.name);
    
    return {
      success: true,
      message: 'Firebase is working correctly!',
      userId: result.user.uid
    };
  } catch (error) {
    console.error('Firebase Test Error:', error);
    return {
      success: false,
      message: 'Firebase connection failed',
      error: error.message
    };
  }
};