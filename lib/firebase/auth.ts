// Firebase Authentication utilities

import { auth } from './config';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

export async function signIn(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file and restart the server.');
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

