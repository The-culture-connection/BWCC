import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// MVP2 tracking API - records future feature requests and actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personId, action, metadata } = body;

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    // Get the current count for this person
    const existingDoc = await adminDb.collection('mvp2')
      .where('personId', '==', personId)
      .where('action', '==', action)
      .orderBy('index', 'desc')
      .limit(1)
      .get();

    let nextIndex = 1;
    if (!existingDoc.empty) {
      const lastDoc = existingDoc.docs[0];
      const lastData = lastDoc.data();
      nextIndex = (lastData.index || 0) + 1;
    }

    // Create new entry
    const entry = {
      personId,
      action,
      index: nextIndex,
      metadata: metadata || {},
      createdAt: Timestamp.fromDate(new Date()),
    };

    await adminDb.collection('mvp2').add(entry);

    return NextResponse.json({ success: true, index: nextIndex }, { status: 200 });
  } catch (error: any) {
    console.error('Error recording MVP2 action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record action' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const personId = searchParams.get('personId');
    const action = searchParams.get('action');

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    let query: any = adminDb.collection('mvp2');
    
    if (personId) {
      query = query.where('personId', '==', personId);
    }
    if (action) {
      query = query.where('action', '==', action);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const entries = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching MVP2 entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

