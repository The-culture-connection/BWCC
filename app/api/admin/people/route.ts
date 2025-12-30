import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getPerson, updatePerson, addPersonNote, createPerson } from '@/lib/firebase/db';
import { convertTimestamps, prepareForFirestore } from '@/lib/firebase/db';
import { Person } from '@/lib/types/database';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const person = await getPerson(id);
      if (!person) {
        return NextResponse.json({ error: 'Person not found' }, { status: 404 });
      }
      return NextResponse.json({ person }, { status: 200 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');
    
    const snapshot = await adminDb.collection('people')
      .orderBy('createdAt', 'desc')
      .get();
    
    const people = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as Person));

    return NextResponse.json({ people }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching people:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch people' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    await updatePerson(id, updates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update person' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a note addition (has id, note, createdBy)
    if (body.id && body.note && body.createdBy) {
      const { id, note, createdBy, type } = body;

      await addPersonNote(id, { note, createdBy, type });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Otherwise, create a new person
    if (!body.name || !body.role) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      );
    }

    const newPerson: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      organization: body.organization,
      expertiseAreas: body.expertiseAreas,
      bio: body.bio,
      headshot: body.headshot,
      availabilityNotes: body.availabilityNotes,
    };

    const personId = await createPerson(newPerson);

    return NextResponse.json({ success: true, id: personId }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/people:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

