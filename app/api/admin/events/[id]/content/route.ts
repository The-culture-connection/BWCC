import { NextRequest, NextResponse } from 'next/server';
import { getEvent, updateEvent } from '@/lib/firebase/db';
import { EventContent } from '@/lib/types/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event = await getEvent(params.id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ content: event.content || null }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching event content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event content' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contentData = await request.json();
    
    // Get current event to merge content
    const event = await getEvent(params.id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updatedContent: EventContent = {
      ...event.content,
      ...contentData,
      updatedAt: new Date(),
      createdAt: event.content?.createdAt || new Date(),
    };

    await updateEvent(params.id, { content: updatedContent });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating event content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update event content' },
      { status: 500 }
    );
  }
}

