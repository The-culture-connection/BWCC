import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Update user document to set subscribedToPrivateCalendar to true
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await userRef.update({
      subscribedToPrivateCalendar: true,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Successfully subscribed to private calendar' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error subscribing to private calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe to private calendar' },
      { status: 500 }
    );
  }
}

