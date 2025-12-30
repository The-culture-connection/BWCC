import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const snapshot = await adminDb.collection('users')
      .orderBy('email', 'asc')
      .get();
    
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email || '',
      name: doc.data().name || '',
      role: doc.data().role || 'staff',
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

