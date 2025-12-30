// Client-side helper to get Firebase ID token

import { auth } from '@/lib/firebase/config';
import { User } from 'firebase/auth';

export async function getIdToken(): Promise<string | null> {
  if (!auth?.currentUser) {
    console.warn('No current user found');
    return null;
  }
  try {
    const token = await auth.currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

export async function getIdTokenForUser(user: User): Promise<string | null> {
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

