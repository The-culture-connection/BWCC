import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[DEBUG] Task upload route called');
    const taskId = params.id;
    console.log('[DEBUG] Task ID:', taskId);

    if (!adminStorage || !adminDb) {
      console.error('[DEBUG] Storage or database not initialized');
      return NextResponse.json({ error: 'Storage or database not initialized' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('[DEBUG] Form data received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!file) {
      console.error('[DEBUG] No file provided in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Firebase Storage - always use tasks/{taskId}/deliverables path
    const filePath = `tasks/${taskId}/deliverables/${Date.now()}-${file.name}`;

    console.log('[DEBUG] File path:', filePath);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('[DEBUG] File buffer size:', buffer.length);

    const bucket = adminStorage.bucket('bwccworkspace.firebasestorage.app');
    const fileRef = bucket.file(filePath);
    
    console.log('[DEBUG] Uploading to Firebase Storage...');
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    console.log('[DEBUG] File saved to Storage');

    console.log('[DEBUG] Making file public...');
    await fileRef.makePublic();
    
    // Also set metadata to ensure public access
    await fileRef.setMetadata({
      metadata: {
        contentType: file.type,
      },
      cacheControl: 'public, max-age=3600',
    });
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log('[DEBUG] Public URL:', publicUrl);
    console.log('[DEBUG] Verifying file is public...');
    
    // Verify the file is accessible
    try {
      const [exists] = await fileRef.exists();
      console.log('[DEBUG] File exists:', exists);
      const [metadata] = await fileRef.getMetadata();
      console.log('[DEBUG] File metadata:', JSON.stringify(metadata));
    } catch (verifyError) {
      console.error('[DEBUG] Error verifying file:', verifyError);
    }

    // Add to task deliverables array
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      console.error('[DEBUG] Task not found in database:', taskId);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data();
    const deliverables = taskData?.deliverables || [];
    console.log('[DEBUG] Current deliverables:', deliverables);
    deliverables.push(publicUrl);
    console.log('[DEBUG] Updated deliverables:', deliverables);

    await taskRef.update({
      deliverables,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    console.log('[DEBUG] Task updated in database');
    console.log('[DEBUG] Final deliverables array length:', deliverables.length);
    console.log('[DEBUG] Final deliverables:', JSON.stringify(deliverables));

    // Verify the update was successful
    const verifyDoc = await taskRef.get();
    const verifyData = verifyDoc.data();
    console.log('[DEBUG] Verification - Task document exists:', verifyDoc.exists);
    console.log('[DEBUG] Verification - Deliverables in document:', verifyData?.deliverables?.length || 0);
    console.log('[DEBUG] Verification - Deliverables array:', JSON.stringify(verifyData?.deliverables || []));

    return NextResponse.json({ 
      url: publicUrl,
      deliverables: verifyData?.deliverables || [],
      success: true 
    }, { status: 200 });
  } catch (error: any) {
    console.error('[DEBUG] Error uploading task deliverable:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    console.error('[DEBUG] Error message:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file', details: error.toString() },
      { status: 500 }
    );
  }
}

