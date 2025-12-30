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
      return NextResponse.redirect(resolved.url);
    }

    if (resolved.kind === 'none') {
      console.log('[DEBUG] Download: Deliverable not found');
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const deliverable = resolved.d;

    // Legacy string URL -> redirect
    if (typeof deliverable === 'string') {
      return NextResponse.redirect(deliverable);
    }

    // Object must have storagePath
    if (!deliverable.storagePath) {
      // fallback: if it has previewUrl, at least redirect to that
      if (deliverable.previewUrl?.startsWith('http')) {
        return NextResponse.redirect(deliverable.previewUrl);
      }
      return NextResponse.json({ error: 'No storage path available' }, { status: 400 });
    }

    const bucket = adminStorage.bucket('bwccworkspace.firebasestorage.app');
    const fileRef = bucket.file(deliverable.storagePath);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    // Stream the file for proper Content-Disposition header
    const [fileBuffer] = await fileRef.download();
    const [metadata] = await fileRef.getMetadata();
    
    const filename = deliverable.fileName || metadata.name?.split('/').pop() || 'download';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': deliverable.contentType || metadata.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(fileBuffer.byteLength),
        'Cache-Control': 'private, max-age=0, no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error downloading deliverable:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}

