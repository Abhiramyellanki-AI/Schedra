import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, getDocs, collection, setDoc, query, where, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

// Configuration can come from environment variables (standard for Vercel)
// or fall back to the AI Studio provided config
const envConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
  databaseId: (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID,
};

const finalConfig = {
  apiKey: envConfig.apiKey || firebaseConfig.apiKey,
  authDomain: envConfig.authDomain || firebaseConfig.authDomain,
  projectId: envConfig.projectId || firebaseConfig.projectId,
  storageBucket: envConfig.storageBucket || firebaseConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || firebaseConfig.messagingSenderId,
  appId: envConfig.appId || firebaseConfig.appId,
};

const databaseId = envConfig.databaseId || firebaseConfig.firestoreDatabaseId || '(default)';

// Initialize Firebase
const app = !getApps().length ? initializeApp(finalConfig) : getApp();
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { serverTimestamp, Timestamp, writeBatch, doc, collection, setDoc, getDoc, query, where, getDocs };

export async function testConnection() {
  if (!finalConfig.apiKey) {
    console.warn("Firebase API Key is missing. Please configure your environment variables.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
