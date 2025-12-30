import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Meeting } from '@/lib/types/database';
import { convertTimestamps, prepareForFirestore } from '@/lib/firebase/db';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const searchParams = request.nextUrl.searchParams;
    const committeeId = searchParams.get('committeeId');

    let query: any = adminDb.collection('meetings');
    
    if (committeeId) {
      query = query.where('committeeId', '==', committeeId);
    }

    const snapshot = await query.orderBy('date', 'desc').get();
    
    const meetings = snapshot.docs.map(doc => 
      convertTimestamps({ id: doc.id, ...doc.data() } as Meeting)
    );

    return NextResponse.json({ meetings }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const body = await request.json();
    const { title, description, date, startTime, endTime, location, attendees, committeeId, minutes, createdBy } = body;
    
    // Get committee members' emails for Google Calendar
    let attendeeEmails: string[] = [];
    if (committeeId && adminDb) {
      try {
        const committeeDoc = await adminDb.collection('committees').doc(committeeId).get();
        if (committeeDoc.exists) {
          const committeeData = committeeDoc.data();
          const memberIds = committeeData?.members || [];
          if (memberIds.length > 0) {
            const userDocs = await Promise.all(
              memberIds.map((uid: string) => adminDb.collection('users').doc(uid).get())
            );
            attendeeEmails = userDocs
              .map(doc => doc.data()?.email)
              .filter((email: string | undefined): email is string => !!email);
          }
        }
      } catch (error) {
        console.error('Error fetching committee member emails:', error);
      }
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Meeting title is required' },
        { status: 400 }
      );
    }

    if (!createdBy) {
      return NextResponse.json(
        { error: 'createdBy is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Meeting date is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    
    // Handle date/time combination properly
    // If startTime is provided as a time string (HH:MM), combine with date
    let meetingStartTime: Date | undefined;
    let meetingEndTime: Date | undefined;
    let meetingDate: Date;
    
    if (date) {
      meetingDate = new Date(date);
      // If startTime is provided, combine with date
      if (startTime) {
        // Check if startTime is just time (HH:MM) or full datetime
        if (startTime.includes('T')) {
          meetingStartTime = new Date(startTime);
        } else {
          // Combine date with time
          const dateStr = date.split('T')[0]; // Get just the date part
          meetingStartTime = new Date(`${dateStr}T${startTime}`);
        }
      }
      
      // If endTime is provided, combine with date
      if (endTime) {
        if (endTime.includes('T')) {
          meetingEndTime = new Date(endTime);
        } else {
          const dateStr = date.split('T')[0];
          meetingEndTime = new Date(`${dateStr}T${endTime}`);
        }
      }
    } else {
      meetingDate = now;
    }
    
    const meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description || undefined,
      date: meetingDate,
      startTime: meetingStartTime,
      endTime: meetingEndTime,
      location: location || undefined,
      attendees: attendees || [],
      committeeId: committeeId || undefined,
      minutes: minutes || undefined,
      createdBy,
    };

    const meetingData = {
      ...prepareForFirestore(meeting),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await adminDb.collection('meetings').add(meetingData);
    const meetingId = docRef.id;

    // Update committee's relatedMeetingIds if committeeId is provided
    if (committeeId) {
      const committeeRef = adminDb.collection('committees').doc(committeeId);
      const committeeDoc = await committeeRef.get();
      if (committeeDoc.exists) {
        const committeeData = committeeDoc.data();
        const relatedMeetingIds = committeeData?.relatedMeetingIds || [];
        relatedMeetingIds.push(meetingId);
        await committeeRef.update({
          relatedMeetingIds,
          updatedAt: Timestamp.fromDate(now),
        });
      }
    }

    // Create corresponding Event record with status="Approved" and isPublicEvent=false
    try {
      const { createEvent } = await import('@/lib/firebase/db');
      const eventId = await createEvent({
        eventTitle: title.trim(),
        eventType: 'Other',
        status: 'Approved',
        isPublicEvent: false,
        marketingStatus: 'Not Needed',
        date: meetingDate,
        startTime: meetingStartTime,
        endTime: meetingEndTime,
        location: location || undefined,
        description: description || undefined,
        relatedCommitteeIds: committeeId ? [committeeId] : undefined,
      });
      console.log(`[DEBUG] Created event ${eventId} for meeting ${meetingId} with status=Approved, isPublicEvent=false`);
    } catch (error) {
      console.error('Error creating event for meeting:', error);
      // Don't fail the meeting creation if event creation fails
    }

    return NextResponse.json({ id: meetingId, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    const updateData: any = {
      ...prepareForFirestore(updates),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Handle date fields
    if (updates.date) {
      updateData.date = Timestamp.fromDate(new Date(updates.date));
    }
    if (updates.startTime) {
      updateData.startTime = Timestamp.fromDate(new Date(updates.startTime));
    }
    if (updates.endTime) {
      updateData.endTime = Timestamp.fromDate(new Date(updates.endTime));
    }

    await adminDb.collection('meetings').doc(id).update(updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

