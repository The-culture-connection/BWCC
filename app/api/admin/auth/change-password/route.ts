import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, currentPassword, newPassword } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user to verify they exist
    const user = await adminAuth.getUser(uid);

    // Note: Firebase Admin SDK doesn't support password verification directly
    // We need to use the client SDK for password changes
    // This endpoint validates the request, but actual password change happens client-side
    // The client will call Firebase Auth's updatePassword after re-authentication

    return NextResponse.json({ 
      success: true,
      message: 'Password change validated. Please use client-side Firebase Auth to complete the change.'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message || 'Failed to validate password change' }, { status: 500 });
  }
}

