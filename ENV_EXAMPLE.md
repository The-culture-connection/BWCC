# Environment Variables Setup

Add these to your `.env.local` file:

## Required for Server-Side (Firebase Admin)

**Option 1: Service Account File Path (Easiest)**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json
```

Or use absolute path:
```bash
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\grace\OneDrive - University of Cincinnati\Desktop\BWCC Website\bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json
```

**Option 2: Service Account JSON (For Production/Deployment)**
Copy the entire JSON content from your service account file and add:
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"bwccworkspace",...}
```

## Required for Client-Side (Firebase Auth)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
```

Get the API key from Firebase Console → Project Settings → General → Your apps

## Optional

```bash
FIREBASE_PROJECT_ID=bwccworkspace
```

## Production URL Configuration (Railway)

For production deployment on Railway, you may optionally set:

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

Or Railway will automatically provide:
- `RAILWAY_PUBLIC_DOMAIN` - Your Railway public domain (auto-provided)

The application will automatically use the correct base URL in production. If not set, it will use `window.location.origin` on the client side, which works correctly in most hosting environments.

## Complete .env.local Example

```bash
# Firebase Admin (Server-Side)
GOOGLE_APPLICATION_CREDENTIALS=./bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json

# Firebase Client (Client-Side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
```

