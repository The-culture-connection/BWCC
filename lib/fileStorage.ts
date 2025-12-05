/**
 * File Storage Utility
 * 
 * This module handles file uploads to external storage services.
 * Notion's Files property requires publicly accessible URLs.
 * 
 * Recommended services:
 * - Cloudinary (free tier available)
 * - AWS S3
 * - Vercel Blob Storage
 * - Google Cloud Storage
 */

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
}

/**
 * Upload file to Cloudinary
 * 
 * Option 1: Signed upload (recommended for server-side)
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * 
 * Option 2: Unsigned upload (if you create an upload preset in dashboard)
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET
 * 
 * To create an unsigned upload preset:
 * 1. Go to Cloudinary Dashboard → Settings → Upload
 * 2. Scroll to "Upload presets"
 * 3. Click "Add upload preset"
 * 4. Set Signing mode to "Unsigned"
 * 5. Set Folder to "bwcc-uploads" (optional)
 * 6. Save and copy the preset name (e.g., "bwcc-unsigned-upload")
 */
export async function uploadToCloudinary(file: File): Promise<FileUploadResult | null> {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET; // Optional: preset name as string (e.g., "bwcc-unsigned-upload")

  if (!cloudinaryCloudName) {
    console.warn('Cloudinary cloud name not configured. Skipping file upload.');
    return null;
  }

  try {
    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const folder = 'bwcc-uploads';
    
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('folder', folder);

    // Option 1: Use unsigned upload preset (if provided)
    if (uploadPreset) {
      // Upload preset name is just a string like "bwcc-unsigned-upload"
      formData.append('upload_preset', uploadPreset);
    }
    // Option 2: Use signed upload with API credentials
    else if (cloudinaryApiKey && cloudinaryApiSecret) {
      // Generate signature for authenticated upload
      const crypto = await import('crypto');
      const timestamp = Math.round(new Date().getTime() / 1000);
      const params: Record<string, string> = {
        folder: folder,
        timestamp: timestamp.toString(),
      };

      // Create signature string
      const paramString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const signature = crypto
        .createHash('sha1')
        .update(paramString + cloudinaryApiSecret)
        .digest('hex');

      formData.append('api_key', cloudinaryApiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
    } else {
      throw new Error('Either CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET must be configured');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      filename: file.name,
      size: file.size,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

/**
 * Upload file to Vercel Blob Storage
 * Requires: BLOB_READ_WRITE_TOKEN
 */
export async function uploadToVercelBlob(file: File): Promise<FileUploadResult | null> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    console.warn('Vercel Blob token not configured. Skipping file upload.');
    return null;
  }

  try {
    const bytes = await file.arrayBuffer();
    const filename = `${Date.now()}-${file.name}`;

    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${blobToken}`,
        'Content-Type': file.type,
      },
      body: bytes,
    });

    if (!response.ok) {
      throw new Error('Vercel Blob upload failed');
    }

    const data = await response.json();

    return {
      url: data.url,
      filename: file.name,
      size: file.size,
    };
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    return null;
  }
}

/**
 * Main file upload function
 * Tries different storage services in order of preference
 */
export async function uploadFile(file: File): Promise<FileUploadResult | null> {
  // Try Cloudinary first
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const result = await uploadToCloudinary(file);
    if (result) return result;
  }

  // Try Vercel Blob second
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await uploadToVercelBlob(file);
    if (result) return result;
  }

  // If no storage service is configured, return null
  // Files will be stored as text references in the Details field
  console.warn('No file storage service configured. File will be stored as text reference only.');
  return null;
}

