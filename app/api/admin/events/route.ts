import { NextRequest, NextResponse } from 'next/server';
import { getEvents, updateEvent, getEvent, createEvent } from '@/lib/firebase/db';
import { Event } from '@/lib/types/database';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const isPublic = searchParams.get('isPublic');
    const id = searchParams.get('id');

    if (id) {
      if (!adminDb) throw new Error('Firebase Admin not initialized');
      
      const doc = await adminDb.collection('events').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      const rawData = doc.data();
      const converted = await getEvent(id);
      
      if (!converted) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      // Fix arrays that got converted to objects - ensure relatedCommitteeIds and relatedPersonIds stay as arrays of strings only
      const rawCommitteeIds = Array.isArray(rawData?.relatedCommitteeIds) ? rawData.relatedCommitteeIds : [];
      const cleanCommitteeIds = rawCommitteeIds.filter((c: any) => typeof c === 'string');
      
      const rawPersonIds = Array.isArray(rawData?.relatedPersonIds) ? rawData.relatedPersonIds : [];
      const cleanPersonIds = rawPersonIds.filter((p: any) => typeof p === 'string');
      
      const event = {
        ...converted,
        relatedCommitteeIds: cleanCommitteeIds,
        relatedPersonIds: cleanPersonIds,
      };
      
      // If we cleaned up corrupted data, update the document
      if (cleanCommitteeIds.length !== rawCommitteeIds.length || cleanPersonIds.length !== rawPersonIds.length) {
        await adminDb.collection('events').doc(id).update({
          relatedCommitteeIds: cleanCommitteeIds,
          relatedPersonIds: cleanPersonIds,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }
      
      return NextResponse.json({ event }, { status: 200 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');
    
    let query: any = adminDb.collection('events');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    if (isPublic === 'true') {
      query = query.where('isPublicEvent', '==', true);
    } else if (isPublic === 'false') {
      query = query.where('isPublicEvent', '==', false);
    }
    
    const snapshot = await query.orderBy('date', 'asc').get();
    
    // Fix arrays that got converted to objects - clean up corrupted data
    const events = await Promise.all(snapshot.docs.map(async (doc: any) => {
      const rawData = doc.data();
      const converted = await getEvent(doc.id);
      if (!converted) return null;
      
      // Clean up relatedCommitteeIds - filter out any objects, keep only strings
      const rawCommitteeIds = Array.isArray(rawData?.relatedCommitteeIds) ? rawData.relatedCommitteeIds : [];
      const cleanCommitteeIds = rawCommitteeIds.filter((c: any) => typeof c === 'string');
      
      // If we cleaned up corrupted data, update the document
      if (cleanCommitteeIds.length !== rawCommitteeIds.length && adminDb) {
        await adminDb.collection('events').doc(doc.id).update({
          relatedCommitteeIds: cleanCommitteeIds,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }
      
      return {
        ...converted,
        relatedCommitteeIds: cleanCommitteeIds,
      };
    }));
    
    const cleanEvents = events.filter((e): e is Event => e !== null);

    return NextResponse.json({ events: cleanEvents }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    // Validate required fields
    if (!eventData.eventTitle || !eventData.eventType || !eventData.status) {
      return NextResponse.json(
        { error: 'Event title, type, and status are required' },
        { status: 400 }
      );
    }

    // Prepare event data
    const newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      eventTitle: eventData.eventTitle,
      eventType: eventData.eventType,
      status: eventData.status,
      isPublicEvent: eventData.isPublicEvent || false,
      marketingStatus: eventData.marketingStatus || 'Not Needed',
      date: eventData.date ? new Date(eventData.date) : undefined,
      startTime: eventData.startTime ? new Date(eventData.startTime) : undefined,
      endTime: eventData.endTime ? new Date(eventData.endTime) : undefined,
      location: eventData.location,
      purpose: eventData.purpose,
      audienceType: eventData.audienceType,
      audienceNumber: eventData.audienceNumber,
      description: eventData.description,
      goalsMetrics: eventData.goalsMetrics,
      participantCriteria: eventData.participantCriteria,
      compensationOffered: eventData.compensationOffered,
      relatedCommitteeIds: eventData.relatedCommitteeIds,
      relatedPersonIds: eventData.relatedPersonIds,
    };

    const eventId = await createEvent(newEvent);

    // Get the created event to sync to Google Calendar
    const createdEvent = await getEvent(eventId);
    if (createdEvent) {
      // Sync to Google Calendar if it's a private approved event
      try {
        const { syncEventToGoogleCalendar, getGoogleMeetLink } = await import('@/lib/google-calendar/service');
        const googleCalendarEventId = await syncEventToGoogleCalendar(createdEvent, false);
        
        // Update event with Google Calendar event ID and Meet link if sync was successful
        if (googleCalendarEventId) {
          const meetLink = await getGoogleMeetLink(googleCalendarEventId);
          await updateEvent(eventId, { 
            googleCalendarEventId,
            ...(meetLink && { virtualMeetingLink: meetLink })
          });
        }
      } catch (error) {
        console.error('Error syncing event to Google Calendar:', error);
        // Don't fail the request if Google Calendar sync fails
      }
    }

    // Link event to committees bidirectionally
    if (eventData.relatedCommitteeIds && Array.isArray(eventData.relatedCommitteeIds) && eventData.relatedCommitteeIds.length > 0) {
      const { adminDb } = await import('@/lib/firebase/admin');
      if (adminDb) {
        for (const committeeId of eventData.relatedCommitteeIds) {
          try {
            const committeeRef = adminDb.collection('committees').doc(committeeId);
            const committeeDoc = await committeeRef.get();
            if (committeeDoc.exists) {
              const committeeData = committeeDoc.data();
              const relatedEventIds = committeeData?.relatedEventIds || [];
              if (!relatedEventIds.includes(eventId)) {
                relatedEventIds.push(eventId);
                await committeeRef.update({
                  relatedEventIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              }
            }
          } catch (error) {
            console.error(`Error linking event ${eventId} to committee ${committeeId}:`, error);
          }
        }
      }
    }

    // Link event to people bidirectionally
    if (eventData.relatedPersonIds && Array.isArray(eventData.relatedPersonIds) && eventData.relatedPersonIds.length > 0) {
      const { adminDb } = await import('@/lib/firebase/admin');
      if (adminDb) {
        for (const personId of eventData.relatedPersonIds) {
          if (typeof personId !== 'string') continue;
          try {
            const personRef = adminDb.collection('people').doc(personId);
            const personDoc = await personRef.get();
            if (personDoc.exists) {
              const personData = personDoc.data();
              const relatedEventIds = Array.isArray(personData?.relatedEventIds) ? personData.relatedEventIds : [];
              if (!relatedEventIds.includes(eventId)) {
                relatedEventIds.push(eventId);
                await personRef.update({
                  relatedEventIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              }
            }
          } catch (error) {
            console.error(`Error linking event ${eventId} to person ${personId}:`, error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, id: eventId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    // Get current event data from raw Firestore to avoid array conversion issues
    const currentDoc = await adminDb.collection('events').doc(id).get();
    if (!currentDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const currentRawData = currentDoc.data();
    // Ensure oldCommitteeIds and oldPersonIds are arrays of strings (filter out any objects)
    const oldCommitteeIdsRaw = Array.isArray(currentRawData?.relatedCommitteeIds) ? currentRawData.relatedCommitteeIds : [];
    const oldCommitteeIds = oldCommitteeIdsRaw.filter((c: any) => typeof c === 'string');
    
    const oldPersonIdsRaw = Array.isArray(currentRawData?.relatedPersonIds) ? currentRawData.relatedPersonIds : [];
    const oldPersonIds = oldPersonIdsRaw.filter((p: any) => typeof p === 'string');

    // Handle bidirectional linking with committees if relatedCommitteeIds changed
    if (updates.relatedCommitteeIds !== undefined) {
      // Ensure relatedCommitteeIds is an array of strings
      const newCommitteeIds = Array.isArray(updates.relatedCommitteeIds) 
        ? updates.relatedCommitteeIds.filter((c: any) => typeof c === 'string')
        : [];
      
      // Update the updates object to use the filtered array
      updates.relatedCommitteeIds = newCommitteeIds;
      
      // Remove event from old committees
      for (const committeeId of oldCommitteeIds) {
        if (typeof committeeId !== 'string') {
          console.error('Invalid committee ID (not a string):', committeeId);
          continue;
        }
        
        if (!newCommitteeIds.includes(committeeId)) {
          try {
            const committeeRef = adminDb.collection('committees').doc(committeeId);
            const committeeDoc = await committeeRef.get();
            if (committeeDoc.exists) {
              const committeeData = committeeDoc.data();
              const relatedEventIds = Array.isArray(committeeData?.relatedEventIds) 
                ? committeeData.relatedEventIds.filter((eid: string) => eid !== id)
                : [];
              await committeeRef.update({
                relatedEventIds,
                updatedAt: Timestamp.fromDate(new Date()),
              });
            }
          } catch (error) {
            console.error(`Error unlinking event ${id} from committee ${committeeId}:`, error);
          }
        }
      }
      
      // Add event to new committees
      for (const committeeId of newCommitteeIds) {
        if (typeof committeeId !== 'string') {
          console.error('Invalid committee ID (not a string):', committeeId);
          continue;
        }
        
        if (!oldCommitteeIds.includes(committeeId)) {
          try {
            const committeeRef = adminDb.collection('committees').doc(committeeId);
            const committeeDoc = await committeeRef.get();
            if (committeeDoc.exists) {
              const committeeData = committeeDoc.data();
              const relatedEventIds = Array.isArray(committeeData?.relatedEventIds) ? committeeData.relatedEventIds : [];
              if (!relatedEventIds.includes(id)) {
                relatedEventIds.push(id);
                await committeeRef.update({
                  relatedEventIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              }
            }
          } catch (error) {
            console.error(`Error linking event ${id} to committee ${committeeId}:`, error);
          }
        }
      }
    }

    // Handle bidirectional linking with people if relatedPersonIds changed
    if (updates.relatedPersonIds !== undefined) {
      // Ensure relatedPersonIds is an array of strings
      const newPersonIds = Array.isArray(updates.relatedPersonIds) 
        ? updates.relatedPersonIds.filter((p: any) => typeof p === 'string')
        : [];
      
      // Update the updates object to use the filtered array
      updates.relatedPersonIds = newPersonIds;
      
      // Remove event from old people
      for (const personId of oldPersonIds) {
        if (typeof personId !== 'string') {
          console.error('Invalid person ID (not a string):', personId);
          continue;
        }
        
        if (!newPersonIds.includes(personId)) {
          try {
            const personRef = adminDb.collection('people').doc(personId);
            const personDoc = await personRef.get();
            if (personDoc.exists) {
              const personData = personDoc.data();
              const relatedEventIds = Array.isArray(personData?.relatedEventIds) 
                ? personData.relatedEventIds.filter((eid: string) => eid !== id)
                : [];
              await personRef.update({
                relatedEventIds,
                updatedAt: Timestamp.fromDate(new Date()),
              });
            }
          } catch (error) {
            console.error(`Error unlinking event ${id} from person ${personId}:`, error);
          }
        }
      }
      
      // Add event to new people
      for (const personId of newPersonIds) {
        if (typeof personId !== 'string') {
          console.error('Invalid person ID (not a string):', personId);
          continue;
        }
        
        if (!oldPersonIds.includes(personId)) {
          try {
            const personRef = adminDb.collection('people').doc(personId);
            const personDoc = await personRef.get();
            if (personDoc.exists) {
              const personData = personDoc.data();
              const relatedEventIds = Array.isArray(personData?.relatedEventIds) ? personData.relatedEventIds : [];
              if (!relatedEventIds.includes(id)) {
                relatedEventIds.push(id);
                await personRef.update({
                  relatedEventIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              }
            }
          } catch (error) {
            console.error(`Error linking event ${id} to person ${personId}:`, error);
          }
        }
      }
    }

    // Update the event - ensure relatedCommitteeIds is clean before saving
    if (updates.relatedCommitteeIds !== undefined) {
      updates.relatedCommitteeIds = Array.isArray(updates.relatedCommitteeIds) 
        ? updates.relatedCommitteeIds.filter((c: any) => typeof c === 'string')
        : [];
    }
    
    await updateEvent(id, updates);

    // Sync to Google Calendar after update
    try {
      const updatedEvent = await getEvent(id);
      if (updatedEvent) {
        const { syncEventToGoogleCalendar } = await import('@/lib/google-calendar/service');
        const googleCalendarEventId = await syncEventToGoogleCalendar(updatedEvent, true);
        
        // Update event with Google Calendar event ID if sync was successful and it changed
        if (googleCalendarEventId && googleCalendarEventId !== updatedEvent.googleCalendarEventId) {
          await updateEvent(id, { googleCalendarEventId });
        }
      }
    } catch (error) {
      console.error('Error syncing event to Google Calendar:', error);
      // Don't fail the request if Google Calendar sync fails
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}


