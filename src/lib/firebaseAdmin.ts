// src/lib/firebaseAdmin.ts
// SERVER-ONLY. Never import from client components or middleware.

import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Read env and normalize private key newlines
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials:");
  console.error("  FIREBASE_PROJECT_ID:", projectId ? "✓" : "✗");
  console.error("  FIREBASE_CLIENT_EMAIL:", clientEmail ? "✓" : "✗");
  console.error("  FIREBASE_PRIVATE_KEY:", privateKey ? "✓" : "✗");
  throw new Error("Missing Firebase Admin env vars. Check your .env.local");
}

let adminApp: App;

try {
  adminApp = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
} catch {
  // Handle HMR duplicate-initialization race
  adminApp = getApp();
}

export const adminAuth = getAuth(adminApp);
export { adminApp };
