// Helper functions for user management with Firestore users collection

import { adminDb } from './admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface UserRole {
  uid: string;
  email: string;
  role: 'admin' | 'board' | 'staff';
  createdAt?: Date;
  lastLogin?: Date;
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const doc = await adminDb.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data();
  return {
    uid: doc.id,
    email: data?.email || '',
    role: data?.role || 'staff',
    createdAt: data?.createdAt?.toDate(),
    lastLogin: data?.lastLogin?.toDate(),
  };
}

export async function createOrUpdateUser(uid: string, email: string, role: 'admin' | 'board' | 'staff'): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();
  
  const updateData: any = {
    email,
    role,
    lastLogin: Timestamp.fromDate(new Date()),
  };
  
  if (!userDoc.exists) {
    updateData.createdAt = Timestamp.fromDate(new Date());
  }
  
  await userRef.set(updateData, { merge: true });
}

export async function updateUserLastLogin(uid: string): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  await adminDb.collection('users').doc(uid).update({
    lastLogin: Timestamp.fromDate(new Date()),
  });
}

