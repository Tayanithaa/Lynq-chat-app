import admin from "firebase-admin";

// For now, disable Firebase Admin to avoid private key parsing errors
// The frontend uses Firebase client SDK which is sufficient
let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

console.log("⚠️ Firebase Admin disabled - using client-side Firebase only");

export { db, auth };
