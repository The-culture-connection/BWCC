import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    if (!adminStorage || !adminDb) {
      return NextResponse.json({ error: 'Storage or database not initialized' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Firebase Storage
    const filePath = `events/${eventId}/content/${Date.now()}-${file.name}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucket = adminStorage.bucket('bwccworkspace.firebasestorage.app');
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Determine file type and add to appropriate array in event content
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    const content = eventData?.content || {};
    const fileType = file.type.startsWith('image/') ? 'photos' : 
                     file.type.startsWith('video/') ? 'videos' : 'documents';

    if (!content[fileType]) {
      content[fileType] = [];
    }
    content[fileType].push(publicUrl);
    content.updatedAt = Timestamp.fromDate(new Date());
    if (!content.createdAt) {
      content.createdAt = Timestamp.fromDate(new Date());
    }

    await eventRef.update({
      content,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return NextResponse.json({ url: publicUrl, fileType }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading event content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

