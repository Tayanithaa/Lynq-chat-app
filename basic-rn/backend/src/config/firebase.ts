import admin from "firebase-admin";

// Check if Firebase Admin should be disabled
const isFirebaseDisabled = process.env.FIREBASE_ADMIN_DISABLED === 'true';

let auth: admin.auth.Auth | null = null;
let db: admin.firestore.Firestore | null = null;

if (!isFirebaseDisabled) {
  try {
    // Try to import service account
    const serviceAccount = require("./serviceAccount.json");
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    
    auth = admin.auth();
    db = admin.firestore();
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.warn("⚠️ Firebase Admin initialization failed, running without Firebase Admin");
    console.warn("Error:", error instanceof Error ? error.message : "Unknown error");
  }
} else {
  console.warn("⚠️ Firebase Admin disabled - using client-side Firebase only");
}

export { auth, db };

