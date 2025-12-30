import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/firebase/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includePrivate = searchParams.get('private') === 'true';

    // Get events from Firebase
    const allEvents = await getEvents({ status: 'Approved' });
    
    // Filter events based on privacy
    let events = allEvents;
    if (!includePrivate) {
      events = allEvents.filter(event => event.isPublicEvent);
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

