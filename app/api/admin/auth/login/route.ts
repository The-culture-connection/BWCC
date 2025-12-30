import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createOrUpdateUser } from '@/lib/firebase/user-helpers';

export async function POST(request: NextRequest) {
  try {
    const { idToken, email, role } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Create or update user in Firestore users collection
    // Default role to 'staff' if not provided
    await createOrUpdateUser(decodedToken.uid, decodedToken.email || email || '', role || 'staff');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}

