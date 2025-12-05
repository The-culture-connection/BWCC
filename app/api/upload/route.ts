import { NextRequest, NextResponse } from 'next/server';

/**
 * Upload file to Notion
 * Notion requires files to be publicly accessible URLs
 * For now, we'll use a simple approach: upload to a temporary location
 * In production, you should use AWS S3, Cloudinary, or Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // For now, we'll convert the file to a data URL
    // In production, upload to a storage service first
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Note: Notion doesn't accept data URLs directly
    // You need to upload to a public URL first (AWS S3, Cloudinary, etc.)
    // For now, return the file info so it can be stored as reference
    return NextResponse.json({
      filename: file.name,
      size: file.size,
      type: file.type,
      // In production, return the public URL here instead
      // url: publicUrl
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

