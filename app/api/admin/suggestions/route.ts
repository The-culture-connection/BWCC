import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comment, page } = body;

    if (!comment || !page) {
      return NextResponse.json(
        { error: 'Comment and page are required' },
        { status: 400 }
      );
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const suggestion = {
      comment,
      page,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await adminDb.collection('suggestions').add(suggestion);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const snapshot = await adminDb.collection('suggestions')
      .orderBy('createdAt', 'desc')
      .get();

    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
