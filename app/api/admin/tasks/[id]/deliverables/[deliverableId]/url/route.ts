import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { resolveDeliverable } from '../utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliverableId: string }> | { id: string; deliverableId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const taskId = resolvedParams.id;
    const deliverableId = resolvedParams.deliverableId;

    if (!adminStorage || !adminDb) {
      return NextResponse.json({ error: 'Storage or database not initialized' }, { status: 500 });
    }

    // Get task and find deliverable
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data();
    const deliverables = taskData?.deliverables || [];

    // Use shared resolver for mixed arrays
    const resolved = resolveDeliverable(deliverables, deliverableId);

    if (resolved.kind === 'rawUrl') {
      return NextResponse.json({ url: resolved.url });
    }

    if (resolved.kind === 'none') {
      console.log('[DEBUG] Deliverable not found. Available IDs:', deliverables.map((d: any, idx: number) => {
        if (typeof d === 'string') return `legacy-${idx}`;
        if (d && typeof d === 'object') return d.id || `obj-${idx}`;
        return `unknown-${idx}`;
      }));
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const deliverable = resolved.d;

    // If it's a legacy string, return it
    if (typeof deliverable === 'string') {
      return NextResponse.json({ url: deliverable });
    }

    // If object has previewUrl
    if (deliverable.previewUrl && deliverable.previewUrl.startsWith('http')) {
      return NextResponse.json({ url: deliverable.previewUrl });
    }

    // Otherwise sign from storagePath
    if (!deliverable.storagePath) {
      return NextResponse.json({ error: 'No storage path available' }, { status: 400 });
    }

    const bucket = adminStorage.bucket('bwccworkspace.firebasestorage.app');
    const fileRef = bucket.file(deliverable.storagePath);

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Error getting deliverable URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get URL' },
      { status: 500 }
    );
  }
}

