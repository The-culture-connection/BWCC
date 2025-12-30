import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Auth or database not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { email, password, role, name } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || email.split('@')[0],
    });

    // Add user to users collection
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name: name || email.split('@')[0],
      role: role || 'staff',
      uid: userRecord.uid,
      createdAt: Timestamp.fromDate(new Date()),
      lastLogin: null,
    });

    return NextResponse.json({ 
      success: true, 
      uid: userRecord.uid,
      email: userRecord.email 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

