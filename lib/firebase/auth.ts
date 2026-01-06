// Firebase Authentication utilities

import { auth } from './config';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';

export async function signIn(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file and restart the server.');
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file and restart the server.');
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
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

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!auth || !auth.currentUser) {
    throw new Error('User must be signed in to change password');
  }

  const user = auth.currentUser;
  const email = user.email;

  if (!email) {
    throw new Error('User email not found');
  }

  // Re-authenticate user with current password
  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Update password
  await updatePassword(user, newPassword);
}

export async function resetPassword(email: string) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file and restart the server.');
  }
  return sendPasswordResetEmail(auth, email);
}

