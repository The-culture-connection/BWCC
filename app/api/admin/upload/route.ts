import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    if (!adminStorage) {
      return NextResponse.json({ error: 'Storage not initialized' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const taskId = formData.get('taskId') as string;
    const folder = formData.get('folder') as string; // 'event-content' or 'task-deliverables'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine the path based on folder type
    let filePath: string;
    if (folder === 'event-content' && eventId) {
      filePath = `events/${eventId}/content/${Date.now()}-${file.name}`;
    } else if (folder === 'task-deliverables' && taskId) {
      // For tasks, we also need eventId to organize by event
      const eventIdFromForm = formData.get('eventId') as string;
      if (eventIdFromForm) {
        filePath = `events/${eventIdFromForm}/tasks/${taskId}/deliverables/${Date.now()}-${file.name}`;
      } else {
        filePath = `tasks/${taskId}/deliverables/${Date.now()}-${file.name}`;
      }
    } else {
      return NextResponse.json({ error: 'Invalid folder or missing ID' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get the bucket
    const bucket = adminStorage.bucket('bwccworkspace.firebasestorage.app');

    // Upload file
    const fileRef = bucket.file(filePath);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ url: publicUrl, path: filePath }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

