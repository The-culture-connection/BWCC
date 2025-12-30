# Firebase Authentication Setup Guide

## Required Steps

### 1. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bwccworkspace`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Enable it and click **Save**

### 2. Get Firebase Web App Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on the web app icon (`</>`) or **Add app** if you haven't created one
4. Register your app (give it a nickname like "BWCC Website")
5. Copy the Firebase configuration object

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bwccworkspace.firebaseapp.com",
  projectId: "bwccworkspace",
  storageBucket: "bwccworkspace.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 3. Add Configuration to .env.local

Add these values to your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... (your apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bwccworkspace.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 (your messagingSenderId)
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef (your appId)
```

**Note**: Only `apiKey`, `authDomain`, and `projectId` are strictly required. The others are optional but recommended.

### 4. Create User Accounts

There are two ways to create user accounts:

#### Option A: Via Firebase Console (Recommended for initial setup)

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Add user**
5. Copy the **User UID**

#### Option B: Via Firebase Auth SDK (Users can self-register)

Users can sign up through the login page, but they'll need to be added to the `users` collection manually.

### 5. Add Users to Firestore `users` Collection

For each user you create in Firebase Authentication, add a document to the `users` collection in Firestore:

1. Go to **Firestore Database**
2. Navigate to the `users` collection
3. Click **Add document**
4. Set the **Document ID** to the user's UID (from Firebase Auth)
5. Add these fields:
   - `email` (string): The user's email address
   - `role` (string): One of: `admin`, `board`, or `staff`
   - `uid` (string): The user's UID (same as document ID)

Example document:
```
Document ID: pHnQ3vWzZwYuuBzeiH8NGn0IpSX2
Fields:
  email: "user@example.com"
  role: "admin"
  uid: "pHnQ3vWzZwYuuBzeiH8NGn0IpSX2"
```

### 6. Restart Development Server

After adding the environment variables, restart your development server:

```bash
npm run dev
```

## User Roles

- **admin**: Full access to all admin features
- **board**: Board member access
- **staff**: Staff member access

Currently, all roles have the same permissions, but you can customize this later.

## Testing

1. Navigate to `/admin/login`
2. Sign in with an email/password from a user you created
3. If the user exists in the `users` collection, you'll be redirected to the admin dashboard
4. If not, you'll see an error

## Troubleshooting

### "Firebase Auth not initialized"
- Make sure you've added `NEXT_PUBLIC_FIREBASE_API_KEY` to `.env.local`
- Restart your development server after adding env variables

### "User not found in database"
- Make sure you've created a document in the `users` collection with the user's UID as the document ID
- The document should have `email` and `role` fields

### "Firebase config missing"
- Check that all required environment variables are set
- Make sure variable names start with `NEXT_PUBLIC_` (required for client-side access)

