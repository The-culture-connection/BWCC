# Firebase Setup Guide for BWCC Workspace

This document explains how to set up Firebase for the BWCC website workspace.

## Completed Migration

All Notion API integrations have been replaced with Firebase:
- ✅ Newsletter signups → Firebase `newsletter` collection
- ✅ Get Involved form submissions → Firebase `requests`, `events`, `people`, and `volunteers` collections
- ✅ Events API → Firebase `events` collection
- ✅ Calendar feed → Firebase `events` collection

## Firebase Project Configuration

Your Firebase project:
- **Project ID**: `bwccworkspace`
- **Project Number**: `941756101500`

## Required Setup Steps

### 1. Firebase Admin SDK Setup

For server-side operations, you need to set up Firebase Admin credentials. You already have the service account key file: `bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json`

**Option A: Use Service Account File Path (Recommended)**
Add to your `.env.local`:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json
```

Or use absolute path:
```bash
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\grace\OneDrive - University of Cincinnati\Desktop\BWCC Website\bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json
```

**Option B: Use Service Account JSON as Environment Variable (For Deployment)**
Copy the entire JSON content and add to `.env.local`:
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"bwccworkspace",...}
```
Note: Make sure the entire JSON is on one line or properly escaped.

**Option C: Default Credentials (For Development)**
If using Firebase CLI or Google Cloud SDK:
```bash
gcloud auth application-default login
```

**Note**: The code will automatically look for the service account file in the project root if neither environment variable is set (as a fallback).

### 2. Client-Side Firebase Config (Optional)

If you need client-side Firebase operations, add to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
```

Get these values from Firebase Console → Project Settings → General

### 3. Firestore Database Setup

The following collections will be created automatically when data is written:

- **requests** - Form submissions (speaking, partnerships, listening sessions, etc.)
- **events** - Events & Activities
- **people** - People & Partners database
- **volunteers** - Volunteer applications
- **newsletter** - Newsletter signups
- **tasks** - Task management (to be implemented)
- **schedules** - Schedule/calendar items (to be implemented)
- **users** - User accounts for admin/staff (to be implemented)

### 4. Firestore Security Rules

Set up security rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for events (filtered by status)
    match /events/{eventId} {
      allow read: if resource.data.status == 'Approved';
      allow write: if request.auth != null;
    }
    
    // Authenticated users only for admin collections
    match /requests/{requestId} {
      allow read, write: if request.auth != null;
    }
    
    match /people/{personId} {
      allow read, write: if request.auth != null;
    }
    
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    
    match /schedules/{scheduleId} {
      allow read: if request.auth != null || resource.data.isPrivate == false;
      allow write: if request.auth != null;
    }
    
    // Newsletter signups - public write, admin read
    match /newsletter/{signupId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
    
    // Volunteers - public write, admin read
    match /volunteers/{volunteerId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

### 5. Firebase Authentication Setup

1. Go to Firebase Console → Authentication
2. Enable Email/Password authentication
3. Add authorized domains (your website domains)

## Data Migration Notes

If you have existing data in Notion that you want to migrate:
1. Export data from Notion
2. Use a migration script to transform and import to Firebase
3. Contact developer for assistance with migration scripts

## Next Steps

The following features are still to be implemented:
- Admin workspace UI with authentication
- Dashboard for managing requests, events, and people
- Approval/deny workflows
- CSV export functionality
- Tasks and schedules management
- Event content collection system

See the main README for updates on these features.

