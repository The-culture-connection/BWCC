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
      const event = await getEvent(id);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json({ event }, { status: 200 });
    }

    const events = await getEvents({
      status: status || undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
    });

    return NextResponse.json({ events }, { status: 200 });
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
    };

    const eventId = await createEvent(newEvent);

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

    // Get current event to check for committee changes
    const currentEvent = await getEvent(id);
    
    await updateEvent(id, updates);

    // Handle bidirectional linking with committees if relatedCommitteeIds changed
    if (updates.relatedCommitteeIds !== undefined && adminDb) {
      console.log('[DEBUG] Updating event-committee links for event:', id);
      const oldCommitteeIds = currentEvent?.relatedCommitteeIds || [];
      const newCommitteeIds = Array.isArray(updates.relatedCommitteeIds) ? updates.relatedCommitteeIds : [];
      
      console.log('[DEBUG] Old committee IDs:', oldCommitteeIds);
      console.log('[DEBUG] New committee IDs:', newCommitteeIds);
      
      // Remove event from old committees
      for (const committeeId of oldCommitteeIds) {
        if (!newCommitteeIds.includes(committeeId)) {
          try {
            console.log(`[DEBUG] Removing event ${id} from committee ${committeeId}`);
            const committeeRef = adminDb.collection('committees').doc(committeeId);
            const committeeDoc = await committeeRef.get();
            if (committeeDoc.exists) {
              const committeeData = committeeDoc.data();
              const relatedEventIds = (committeeData?.relatedEventIds || []).filter((eid: string) => eid !== id);
              await committeeRef.update({
                relatedEventIds,
                updatedAt: Timestamp.fromDate(new Date()),
              });
              console.log(`[DEBUG] Successfully removed event ${id} from committee ${committeeId}`);
            } else {
              console.log(`[DEBUG] Committee ${committeeId} not found`);
            }
          } catch (error) {
            console.error(`[DEBUG] Error unlinking event ${id} from committee ${committeeId}:`, error);
          }
        }
      }
      
      // Add event to new committees
      for (const committeeId of newCommitteeIds) {
        if (!oldCommitteeIds.includes(committeeId)) {
          try {
            console.log(`[DEBUG] Adding event ${id} to committee ${committeeId}`);
            const committeeRef = adminDb.collection('committees').doc(committeeId);
            const committeeDoc = await committeeRef.get();
            if (committeeDoc.exists) {
              const committeeData = committeeDoc.data();
              const relatedEventIds = committeeData?.relatedEventIds || [];
              if (!relatedEventIds.includes(id)) {
                relatedEventIds.push(id);
                await committeeRef.update({
                  relatedEventIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
                console.log(`[DEBUG] Successfully added event ${id} to committee ${committeeId}`);
              } else {
                console.log(`[DEBUG] Event ${id} already in committee ${committeeId}`);
              }
            } else {
              console.log(`[DEBUG] Committee ${committeeId} not found`);
            }
          } catch (error) {
            console.error(`[DEBUG] Error linking event ${id} to committee ${committeeId}:`, error);
          }
        }
      }
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

