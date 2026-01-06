import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, role, idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 401 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    // Verify the ID token to get the current user
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Get current user's role to check permissions
    if (!adminDb) throw new Error('Firebase Admin not initialized');
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    const currentUserRole = currentUserDoc.data()?.role || 'staff';

    // Only admins can edit roles
    if (role !== undefined && currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can edit user roles' }, { status: 403 });
    }

    // Users can only edit their own profile (unless they're admin)
    if (id !== currentUserId && currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'You can only edit your own profile' }, { status: 403 });
    }

    // Build update object
    const updates: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (name !== undefined) {
      updates.name = name;
    }

    if (role !== undefined && currentUserRole === 'admin') {
      updates.role = role;
    }

    // Update user document
    await adminDb.collection('users').doc(id).update(updates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

