// config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration with error handling
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBVIez9IvqLfzI-sBUfnIdJlsH8MY0qffI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "otpauth-74252.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "otpauth-74252",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "otpauth-74252.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "680899165938",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:680899165938:web:c511e9b4385ffb2cff5a6b",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0500GXCJQ2",
};

// Debug configuration loading (only in development)
if (__DEV__) {
  console.log("🔥 Firebase Config Debug:", {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : "❌ Missing",
    authDomain: firebaseConfig.authDomain || "❌ Missing",
    projectId: firebaseConfig.projectId || "❌ Missing",
    fromEnv: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "✅ From ENV" : "❌ Using fallback",
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ From ENV" : "❌ Using fallback",
    }
  });
}

let app;
let auth;
let db;

try {
  // Initialize Firebase with error handling
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  if (__DEV__) {
    console.log("✅ Firebase initialized successfully");
  }
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  
  // Create mock objects for development when Firebase fails
  auth = {
    currentUser: null,
    signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase unavailable")),
    createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase unavailable")),
    signOut: () => Promise.resolve(),
    onAuthStateChanged: () => () => {},
  };
  
  db = {
    collection: () => ({
      add: () => Promise.reject(new Error("Firebase unavailable")),
      doc: () => ({
        set: () => Promise.reject(new Error("Firebase unavailable")),
        get: () => Promise.reject(new Error("Firebase unavailable")),
      }),
    }),
  };
  
  console.warn("⚠️ Using mock Firebase objects for development");
}

export { auth, db };
export default app;