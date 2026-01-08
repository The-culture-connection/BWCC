import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getPerson, updatePerson, addPersonNote, createPerson } from '@/lib/firebase/db';
import { convertTimestamps, prepareForFirestore } from '@/lib/firebase/db';
import { Person } from '@/lib/types/database';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to ensure expertiseAreas is always an array of strings
function normalizeExpertiseAreas(expertiseAreas: any): string[] | undefined {
  if (!expertiseAreas) return undefined;
  
  if (Array.isArray(expertiseAreas)) {
    return expertiseAreas.filter((area: any) => typeof area === 'string' && area.length > 0);
  } else if (typeof expertiseAreas === 'object') {
    // Convert object with numeric keys back to array
    const values = Object.values(expertiseAreas).filter((area: any) => typeof area === 'string' && area.length > 0) as string[];
    return values.length > 0 ? values : undefined;
  } else if (typeof expertiseAreas === 'string' && expertiseAreas.length > 0) {
    return [expertiseAreas];
  }
  
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!adminDb) throw new Error('Firebase Admin not initialized');
      
      const doc = await adminDb.collection('people').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Person not found' }, { status: 404 });
      }
      
      const rawData = doc.data();
      const converted = await getPerson(id);
      
      if (!converted) {
        return NextResponse.json({ error: 'Person not found' }, { status: 404 });
      }
      
      // Fix arrays that got converted to objects - ensure relatedEventIds stays as array of strings only
      const rawEventIds = Array.isArray(rawData?.relatedEventIds) ? rawData.relatedEventIds : [];
      const cleanEventIds = rawEventIds.filter((e: any) => typeof e === 'string');
      
      // Normalize expertiseAreas
      const normalizedExpertise = normalizeExpertiseAreas(rawData?.expertiseAreas);
      
      const person = {
        ...converted,
        relatedEventIds: cleanEventIds,
        expertiseAreas: normalizedExpertise,
      };
      
      // If we cleaned up corrupted data, update the document
      const needsUpdate = cleanEventIds.length !== rawEventIds.length || 
                         (normalizedExpertise && JSON.stringify(normalizedExpertise) !== JSON.stringify(rawData?.expertiseAreas));
      if (needsUpdate) {
        const updates: any = {
          relatedEventIds: cleanEventIds,
          updatedAt: Timestamp.fromDate(new Date()),
        };
        if (normalizedExpertise) {
          updates.expertiseAreas = normalizedExpertise;
        }
        await adminDb.collection('people').doc(id).update(updates);
      }
      
      return NextResponse.json({ person }, { status: 200 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');
    
    const snapshot = await adminDb.collection('people')
      .orderBy('createdAt', 'desc')
      .get();
    
    // Fix arrays that got converted to objects
    const people = snapshot.docs.map((doc: any) => {
      const rawData = doc.data();
      const converted = convertTimestamps({ id: doc.id, ...rawData } as Person);
      const rawEventIds = Array.isArray(rawData?.relatedEventIds) ? rawData.relatedEventIds : [];
      const cleanEventIds = rawEventIds.filter((e: any) => typeof e === 'string');
      const normalizedExpertise = normalizeExpertiseAreas(rawData?.expertiseAreas);
      return {
        ...converted,
        relatedEventIds: cleanEventIds,
        expertiseAreas: normalizedExpertise,
      };
    });

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

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    // Get current person data from raw Firestore to avoid array conversion issues
    const currentDoc = await adminDb.collection('people').doc(id).get();
    if (!currentDoc.exists) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }
    
    const currentRawData = currentDoc.data();
    // Ensure oldEventIds is an array of strings (filter out any objects)
    const oldEventIdsRaw = Array.isArray(currentRawData?.relatedEventIds) ? currentRawData.relatedEventIds : [];
    const oldEventIds = oldEventIdsRaw.filter((e: any) => typeof e === 'string');

    // Handle bidirectional linking with events if relatedEventIds changed
    if (updates.relatedEventIds !== undefined) {
      // Ensure relatedEventIds is an array of strings
      const newEventIds = Array.isArray(updates.relatedEventIds) 
        ? updates.relatedEventIds.filter((e: any) => typeof e === 'string')
        : [];
      
      // Update the updates object to use the filtered array
      updates.relatedEventIds = newEventIds;
      
      // Remove person from old events
      for (const eventId of oldEventIds) {
        if (typeof eventId !== 'string') {
          console.error('Invalid event ID (not a string):', eventId);
          continue;
        }
        
        if (!newEventIds.includes(eventId)) {
          try {
            const eventRef = adminDb.collection('events').doc(eventId);
            const eventDoc = await eventRef.get();
            if (eventDoc.exists) {
              const eventData = eventDoc.data();
              const relatedPersonIds = Array.isArray(eventData?.relatedPersonIds) 
                ? eventData.relatedPersonIds.filter((pid: string) => pid !== id)
                : [];
              await eventRef.update({
                relatedPersonIds,
                updatedAt: Timestamp.fromDate(new Date()),
              });
            }
          } catch (error) {
            console.error(`Error unlinking person ${id} from event ${eventId}:`, error);
          }
        }
      }
      
      // Add person to new events
      for (const eventId of newEventIds) {
        if (typeof eventId !== 'string') {
          console.error('Invalid event ID (not a string):', eventId);
          continue;
        }
        
        if (!oldEventIds.includes(eventId)) {
          try {
            const eventRef = adminDb.collection('events').doc(eventId);
            const eventDoc = await eventRef.get();
            if (eventDoc.exists) {
              const eventData = eventDoc.data();
              const relatedPersonIds = Array.isArray(eventData?.relatedPersonIds) ? eventData.relatedPersonIds : [];
              if (!relatedPersonIds.includes(id)) {
                relatedPersonIds.push(id);
                await eventRef.update({
                  relatedPersonIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              }
            }
          } catch (error) {
            console.error(`Error linking person ${id} to event ${eventId}:`, error);
          }
        }
      }
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

    // Normalize expertiseAreas before saving
    const normalizedExpertise = normalizeExpertiseAreas(body.expertiseAreas);
    
    // Ensure relatedEventIds is an array of strings
    const relatedEventIds = Array.isArray(body.relatedEventIds) 
      ? body.relatedEventIds.filter((id: any) => typeof id === 'string')
      : undefined;
    
    const newPerson: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      role: body.role,
      status: body.status || 'Approved', // Default to Approved for admin-created people
      email: body.email,
      phone: body.phone,
      organization: body.organization,
      expertiseAreas: normalizedExpertise,
      bio: body.bio,
      headshot: body.headshot,
      availabilityNotes: body.availabilityNotes,
      relatedEventIds: relatedEventIds,
    };

    const personId = await createPerson(newPerson);

    // Link person to events bidirectionally
    if (relatedEventIds && relatedEventIds.length > 0 && adminDb) {
      for (const eventId of relatedEventIds) {
        try {
          const eventRef = adminDb.collection('events').doc(eventId);
          const eventDoc = await eventRef.get();
          if (eventDoc.exists) {
            const eventData = eventDoc.data();
            const relatedPersonIds = Array.isArray(eventData?.relatedPersonIds) ? eventData.relatedPersonIds : [];
            if (!relatedPersonIds.includes(personId)) {
              relatedPersonIds.push(personId);
              await eventRef.update({
                relatedPersonIds,
                updatedAt: Timestamp.fromDate(new Date()),
              });
            }
          }
        } catch (error) {
          console.error(`Error linking person ${personId} to event ${eventId}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, id: personId }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/people:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

