import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Suggestion } from '@/lib/types/database';
import { convertTimestamps, prepareForFirestore } from '@/lib/firebase/db';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const snapshot = await adminDb.collection('suggestions')
      .orderBy('createdAt', 'desc')
      .get();
    
    const suggestions = snapshot.docs.map(doc => 
      convertTimestamps({ id: doc.id, ...doc.data() } as Suggestion)
    );

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const body = await request.json();
    const { description, category, page } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'updatedAt'> = {
      description: description.trim(),
      category: category || undefined,
      page: page || undefined,
      status: 'New',
    };

    const suggestionData = {
      ...prepareForFirestore(suggestion),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await adminDb.collection('suggestions').add(suggestionData);

    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}
