import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Some networks block Firestore's default streaming connection, which makes chat hang forever.
// Auto-detect switches to a slower but more compatible connection when that happens.
let firestore;
try {
  firestore = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  // Already initialised (happens when the dev server reloads a file)
  firestore = getFirestore(app);
}

export const db = firestore;

// Used only to prove ownership of an email address when resetting a password
export const auth = getAuth(app);