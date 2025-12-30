// Server-side authentication helpers

import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function verifyIdToken(idToken: string) {
  if (!adminAuth) throw new Error('Firebase Admin Auth not initialized');
  return adminAuth.verifyIdToken(idToken);
}

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;
    
    if (!adminAuth) return null;
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

export async function createSessionCookie(idToken: string) {
  if (!adminAuth) throw new Error('Firebase Admin Auth not initialized');
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

