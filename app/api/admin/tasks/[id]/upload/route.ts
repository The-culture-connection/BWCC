import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[DEBUG] ========== UPLOAD START ==========');
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
    console.log('[DEBUG] Bucket name:', bucket.name);
    
    const fileRef = bucket.file(filePath);
    console.log('[DEBUG] File reference created:', fileRef.name);
    
    // Step 1: Upload the file
    console.log('[DEBUG] Step 1: Uploading file to Storage...');
    try {
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });
      console.log('[DEBUG] ✓ File saved successfully');
    } catch (uploadError: any) {
      console.error('[DEBUG] ✗ Error uploading file:', uploadError);
      console.error('[DEBUG] Upload error message:', uploadError.message);
      console.error('[DEBUG] Upload error code:', uploadError.code);
      throw uploadError;
    }
    
    // Step 2: Verify file exists
    console.log('[DEBUG] Step 2: Verifying file exists...');
    try {
      const [exists] = await fileRef.exists();
      console.log('[DEBUG] File exists:', exists);
      if (!exists) {
        throw new Error('File does not exist after upload');
      }
    } catch (existsError: any) {
      console.error('[DEBUG] ✗ Error checking file existence:', existsError);
      throw existsError;
    }
    
    // Step 3: Get metadata before making public
    console.log('[DEBUG] Step 3: Getting file metadata before making public...');
    let metadataBefore: any;
    try {
      [metadataBefore] = await fileRef.getMetadata();
      console.log('[DEBUG] Metadata before makePublic:', JSON.stringify(metadataBefore, null, 2));
      console.log('[DEBUG] ACL before:', metadataBefore.acl);
    } catch (metaError: any) {
      console.error('[DEBUG] ✗ Error getting metadata:', metaError);
      console.error('[DEBUG] Metadata error message:', metaError.message);
    }
    
    // Step 4: Make file public using makePublic()
    console.log('[DEBUG] Step 4: Making file public using makePublic()...');
    try {
      await fileRef.makePublic();
      console.log('[DEBUG] ✓ makePublic() completed');
    } catch (makePublicError: any) {
      console.error('[DEBUG] ✗ Error in makePublic():', makePublicError);
      console.error('[DEBUG] makePublic error message:', makePublicError.message);
      console.error('[DEBUG] makePublic error code:', makePublicError.code);
      console.error('[DEBUG] makePublic error details:', JSON.stringify(makePublicError, null, 2));
      // Note: Even if makePublic fails, the file can still be accessed via signed URLs
    }
    
    // Step 5: Set metadata with public access
    console.log('[DEBUG] Step 5: Setting file metadata...');
    try {
      await fileRef.setMetadata({
        metadata: {
          contentType: file.type,
        },
        cacheControl: 'public, max-age=3600',
      });
      console.log('[DEBUG] ✓ Metadata set successfully');
    } catch (metaSetError: any) {
      console.error('[DEBUG] ✗ Error setting metadata:', metaSetError);
      console.error('[DEBUG] Metadata set error message:', metaSetError.message);
    }
    
    // Step 6: Get metadata after making public
    console.log('[DEBUG] Step 6: Getting file metadata after making public...');
    let metadataAfter: any;
    try {
      [metadataAfter] = await fileRef.getMetadata();
      console.log('[DEBUG] Metadata after makePublic:', JSON.stringify(metadataAfter, null, 2));
      console.log('[DEBUG] ACL after:', metadataAfter.acl);
      console.log('[DEBUG] Self link:', metadataAfter.selfLink);
      console.log('[DEBUG] Media link:', metadataAfter.mediaLink);
    } catch (metaAfterError: any) {
      console.error('[DEBUG] ✗ Error getting metadata after:', metaAfterError);
    }
    
    // Step 7: Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log('[DEBUG] Step 7: Generated public URL:', publicUrl);
    
    // Step 8: Try to get signed URL as alternative/fallback
    console.log('[DEBUG] Step 8: Generating signed URL as fallback...');
    let signedUrl = '';
    try {
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Far future date
      });
      signedUrl = url;
      console.log('[DEBUG] ✓ Signed URL generated:', signedUrl);
    } catch (signedError: any) {
      console.error('[DEBUG] ✗ Error generating signed URL:', signedError);
      console.error('[DEBUG] Signed URL error message:', signedError.message);
    }
    
    // Step 9: File upload complete
    console.log('[DEBUG] Step 9: File upload complete');
    console.log('[DEBUG] ========== UPLOAD END ==========');

    // Create structured deliverable object
    const deliverableId = randomUUID();
    const deliverable = {
      id: deliverableId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      storagePath: filePath,
      previewUrl: signedUrl || publicUrl, // Store preview URL (signed URL preferred)
      createdAt: new Date().toISOString(),
    };
    
    console.log('[DEBUG] Created deliverable object:', JSON.stringify(deliverable, null, 2));

    // Add to task deliverables array
    console.log('[DEBUG] ========== DATABASE UPDATE START ==========');
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      console.error('[DEBUG] Task not found in database:', taskId);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data();
    const deliverables = taskData?.deliverables || [];
    console.log('[DEBUG] Current deliverables count:', deliverables.length);
    console.log('[DEBUG] Current deliverables array:', JSON.stringify(deliverables));
    
    // Add the new structured deliverable
    deliverables.push(deliverable);
    console.log('[DEBUG] Adding deliverable to array');
    console.log('[DEBUG] Updated deliverables count:', deliverables.length);

    console.log('[DEBUG] Updating task document in Firestore...');
    try {
      await taskRef.update({
        deliverables,
        updatedAt: Timestamp.fromDate(new Date()),
      });
      console.log('[DEBUG] ✓ Task updated successfully in database');
    } catch (updateError: any) {
      console.error('[DEBUG] ✗ Error updating task:', updateError);
      console.error('[DEBUG] Update error message:', updateError.message);
      throw updateError;
    }

    // Verify the update was successful
    console.log('[DEBUG] Verifying database update...');
    let verifyData: any;
    try {
      const verifyDoc = await taskRef.get();
      verifyData = verifyDoc.data();
      console.log('[DEBUG] ✓ Verification - Task document exists:', verifyDoc.exists);
      console.log('[DEBUG] Verification - Deliverables in document:', verifyData?.deliverables?.length || 0);
    } catch (verifyError: any) {
      console.error('[DEBUG] ✗ Error verifying database update:', verifyError);
    }
    
    console.log('[DEBUG] ========== RESPONSE PREPARATION ==========');
    console.log('[DEBUG] ========== DATABASE UPDATE END ==========');
    
    return NextResponse.json({ 
      deliverable,
      success: true,
      debug: {
        filePath,
        bucketName: bucket.name,
        metadataAfter: metadataAfter ? {
          acl: metadataAfter.acl,
          selfLink: metadataAfter.selfLink,
          mediaLink: metadataAfter.mediaLink,
        } : null,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('[DEBUG] ========== ERROR OCCURRED ==========');
    console.error('[DEBUG] Error uploading task deliverable:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    console.error('[DEBUG] Error message:', error.message);
    console.error('[DEBUG] Error code:', error.code);
    console.error('[DEBUG] Error details:', JSON.stringify(error, null, 2));
    console.error('[DEBUG] ========== ERROR END ==========');
    return NextResponse.json(
      { error: error.message || 'Failed to upload file', details: error.toString() },
      { status: 500 }
    );
  }
}
