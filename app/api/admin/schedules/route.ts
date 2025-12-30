import { NextRequest, NextResponse } from 'next/server';
import { getSchedules, createSchedule } from '@/lib/firebase/db';
import { adminDb } from '@/lib/firebase/admin';
import { convertTimestamps } from '@/lib/firebase/db';
import { Schedule } from '@/lib/types/database';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const schedules = await getSchedules({
      userId: userId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ schedules }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const scheduleData = await request.json();
    
    const scheduleId = await createSchedule({
      title: scheduleData.title,
      description: scheduleData.description,
      startTime: new Date(scheduleData.startTime),
      endTime: scheduleData.endTime ? new Date(scheduleData.endTime) : undefined,
      location: scheduleData.location,
      type: scheduleData.type || 'other',
      isPrivate: scheduleData.isPrivate !== false,
      relatedEventId: scheduleData.relatedEventId,
      relatedTaskId: scheduleData.relatedTaskId,
      attendees: scheduleData.attendees || [],
      createdBy: scheduleData.createdBy,
    });

    return NextResponse.json({ id: scheduleId, success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startTime) updateData.startTime = Timestamp.fromDate(new Date(updates.startTime));
    if (updates.endTime !== undefined) updateData.endTime = updates.endTime ? Timestamp.fromDate(new Date(updates.endTime)) : null;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.type) updateData.type = updates.type;
    if (updates.isPrivate !== undefined) updateData.isPrivate = updates.isPrivate;
    if (updates.attendees) updateData.attendees = updates.attendees;

    await adminDb.collection('schedules').doc(id).update(updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

