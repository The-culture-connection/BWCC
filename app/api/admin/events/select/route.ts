import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/firebase/db';

// API route to get events for selection dropdowns
export async function GET(request: NextRequest) {
  try {
    // Get approved or pending events (events that can be assigned to)
    const events = await getEvents();
    const selectableEvents = events
      .filter(event => event.status === 'Approved' || event.status === 'Pending' || event.status === 'Requested')
      .map(event => ({
        id: event.id,
        title: event.eventTitle,
        date: event.date ? new Date(event.date).toISOString() : null,
        startTime: event.startTime ? new Date(event.startTime).toISOString() : null,
        endTime: event.endTime ? new Date(event.endTime).toISOString() : null,
        location: event.location,
        eventType: event.eventType,
      }));

    return NextResponse.json({ events: selectableEvents }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching events for selection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

