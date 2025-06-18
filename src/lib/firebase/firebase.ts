import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if we have the required config
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  console.log('Initializing Firebase with config:', {
    apiKey: firebaseConfig.apiKey ? 'present' : 'missing',
    authDomain: firebaseConfig.authDomain ? 'present' : 'missing',
    projectId: firebaseConfig.projectId ? 'present' : 'missing',
    storageBucket: firebaseConfig.storageBucket ? 'present' : 'missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'present' : 'missing',
    appId: firebaseConfig.appId ? 'present' : 'missing',
  });
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} else {
  console.error('Firebase initialization failed:', {
    isWindow: typeof window !== 'undefined',
    hasApiKey: !!firebaseConfig.apiKey,
  });
}

// Create a function to get the initialized instances
export function getFirebaseInstances() {
  if (!auth || !db || !storage) {
    throw new Error('Firebase is not initialized');
  }
  return { auth, db, storage };
}

export { app, auth, db, storage };
