import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Committee } from '@/lib/types/database';
import { convertTimestamps, prepareForFirestore } from '@/lib/firebase/db';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID is provided, return single committee
    if (id) {
      const doc = await adminDb.collection('committees').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
      }
      
      const rawData = doc.data();
      const converted = convertTimestamps({ id: doc.id, ...rawData } as Committee);
      
      // Fix arrays that got converted to objects - ensure members and relatedEventIds stay as arrays
      const committee = {
        ...converted,
        members: Array.isArray(rawData?.members) ? rawData.members : [],
        relatedEventIds: Array.isArray(rawData?.relatedEventIds) ? rawData.relatedEventIds : [],
      };
      
      return NextResponse.json({ committee }, { status: 200 });
    }

    // Otherwise return all committees
    const snapshot = await adminDb.collection('committees')
      .orderBy('createdAt', 'desc')
      .get();
    
    const committees = snapshot.docs.map(doc => {
      const rawData = doc.data();
      const converted = convertTimestamps({ id: doc.id, ...rawData } as Committee);
      
      // Fix arrays that got converted to objects - ensure members and relatedEventIds stay as arrays
      return {
        ...converted,
        members: Array.isArray(rawData?.members) ? rawData.members : [],
        relatedEventIds: Array.isArray(rawData?.relatedEventIds) ? rawData.relatedEventIds : [],
      };
    });

    return NextResponse.json({ committees }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching committees:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const body = await request.json();
    const { name, description, members, createdBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Committee name is required' },
        { status: 400 }
      );
    }

    if (!createdBy) {
      return NextResponse.json(
        { error: 'createdBy is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    // Ensure members is always an array of strings (user IDs)
    const membersArray = Array.isArray(members) ? members.filter(m => typeof m === 'string') : [];
    
    const committee: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description || undefined,
      members: membersArray,
      createdBy,
    };

    const committeeData = {
      ...prepareForFirestore(committee),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await adminDb.collection('committees').add(committeeData);

    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating committee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create committee' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Committee ID is required' }, { status: 400 });
    }

    // Ensure members is always an array of strings (user IDs) if provided
    if (updates.members !== undefined) {
      updates.members = Array.isArray(updates.members) ? updates.members.filter((m: any) => typeof m === 'string') : [];
    }

    const updateData = {
      ...prepareForFirestore(updates),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await adminDb.collection('committees').doc(id).update(updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating committee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update committee' },
      { status: 500 }
    );
  }
}

