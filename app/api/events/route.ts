import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/firebase/db';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includePrivate = searchParams.get('private') === 'true';

    // Get events from Firebase
    // For public calendar: status="Approved" AND isPublicEvent=true
    // For private calendar: all events
    let events;
    if (includePrivate) {
      // Private: fetch all events
      events = await getEvents();
    } else {
      // Public: fetch all events, then filter for Approved + isPublicEvent=true
      const allEvents = await getEvents();
      events = allEvents.filter(event => 
        event.status === 'Approved' && event.isPublicEvent === true
      );
    }

    // Transform to simplified event format
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.eventTitle,
      purpose: event.purpose || '',
      startTime: event.startTime?.toISOString() || event.date?.toISOString() || null,
      location: event.location || '',
      date: event.date?.toISOString().split('T')[0] || '',
      isPublic: event.isPublicEvent,
    }));

    return NextResponse.json({ events: formattedEvents }, { status: 200 });
  } catch (error: any) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

