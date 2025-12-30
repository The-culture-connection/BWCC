import { NextRequest, NextResponse } from 'next/server';
import { getRequests, updateRequest, getRequest } from '@/lib/firebase/db';
import { RequestStatus, Decision } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const decision = searchParams.get('decision');
    const type = searchParams.get('type');

    const requests = await getRequests({
      status: status || undefined,
      decision: decision || undefined,
      type: type as any,
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    await updateRequest(id, updates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}

