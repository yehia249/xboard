// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-8UEFrjBmqRteMqU81dhqMjPpNwJRu4E",
  authDomain: "xboard-b365a.firebaseapp.com",
  projectId: "xboard-b365a",
  storageBucket: "xboard-b365a.firebasestorage.app",
  messagingSenderId: "619698887844",
  appId: "1:619698887844:web:814235533e3eb2966cda31",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { auth };
