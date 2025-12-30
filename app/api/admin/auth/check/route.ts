import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserRole } from '@/lib/firebase/user-helpers';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get user role from Firestore
    const userRole = await getUserRole(decodedToken.uid);
    
    if (!userRole) {
      return NextResponse.json({ authenticated: false, error: 'User not found in database' }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userRole.role,
      },
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 401 });
  }
}

