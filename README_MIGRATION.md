# BWCC Website - Notion to Firebase Migration

## Summary

This migration replaces all Notion API integrations with Firebase Firestore, providing a self-hosted workspace solution for BWCC.

## ✅ Completed

### Core Migration
- ✅ **Newsletter API** - Migrated to Firebase `newsletter` collection
- ✅ **Get Involved API** - Migrated to Firebase `requests`, `events`, `people`, and `volunteers` collections
- ✅ **Events API** - Migrated to Firebase `events` collection  
- ✅ **Calendar Feed** - Migrated to use Firebase `events` collection

### Infrastructure
- ✅ Firebase Admin SDK setup
- ✅ Firestore database utilities and helpers
- ✅ TypeScript type definitions for all data models
- ✅ Request/Event/Person builder functions
- ✅ Data conversion utilities (timestamps, etc.)

### Admin Workspace (Started)
- ✅ Basic authentication structure
- ✅ Admin login page
- ✅ Admin layout component with navigation
- ✅ Basic dashboard page

## 🚧 In Progress / To Do

### Admin Workspace Features
- [ ] Complete authentication flow (needs Firebase client config)
- [ ] Dashboard with real statistics
- [ ] Requests management page with approval/deny workflows
- [ ] Events management page
- [ ] People & Partners database page with notes and metadata
- [ ] Tasks management page
- [ ] Schedules/Calendar page
- [ ] CSV export functionality for all collections
- [ ] Event content collection system

### Technical Tasks
- [ ] Set up Firebase client-side configuration
- [ ] Create API routes for admin operations
- [ ] Implement approval/deny workflows
- [ ] Build CSV export endpoints
- [ ] Add Google Calendar integration (keep existing)
- [ ] Set up Firestore security rules
- [ ] Add user management for board/staff members

## Setup Instructions

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure Firebase Admin SDK**:
   - See `FIREBASE_SETUP.md` for detailed instructions
   - Set up service account key or use default credentials
   - Set `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_PROJECT_ID`

3. **Configure Firebase Client SDK** (for admin authentication):
   - Get API key from Firebase Console
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
     ```

4. **Set up Firebase Authentication**:
   - Enable Email/Password authentication in Firebase Console
   - Create user accounts for board members and staff

5. **Configure Firestore Security Rules**:
   - See `FIREBASE_SETUP.md` for example rules
   - Update in Firebase Console → Firestore Database → Rules

## File Structure

```
lib/
  firebase/
    admin.ts          # Server-side Firebase Admin
    config.ts         # Client-side Firebase config
    db.ts             # Database utility functions
    auth.ts           # Client-side auth utilities
  types/
    database.ts       # TypeScript interfaces
  utils/
    request-helpers.ts # Request/Event/Person builders
    auth-helpers.ts    # Server-side auth helpers

app/
  api/
    get-involved/     # ✅ Migrated to Firebase
    newsletter/       # ✅ Migrated to Firebase
    events/           # ✅ Migrated to Firebase
    calendar/feed/    # ✅ Migrated to Firebase
    auth/             # 🚧 Authentication endpoints
    admin/            # 🚧 Admin API routes (to be created)

  admin/
    login/            # ✅ Admin login page
    page.tsx          # ✅ Dashboard (needs API integration)
    requests/         # 🚧 Requests management (to be created)
    events/           # 🚧 Events management (to be created)
    people/           # 🚧 People database (to be created)
    tasks/            # 🚧 Tasks (to be created)
    schedules/        # 🚧 Schedules (to be created)
    export/           # 🚧 CSV export (to be created)

components/
  AdminLayout.tsx     # ✅ Admin layout with sidebar
```

## Next Steps

1. Complete Firebase setup (see `FIREBASE_SETUP.md`)
2. Test existing API routes with Firebase
3. Build out admin workspace pages
4. Implement approval workflows
5. Add CSV export functionality
6. Test end-to-end workflows

## Notes

- All existing public-facing forms continue to work (newsletter, get-involved)
- Calendar feeds continue to work (public and private)
- No data migration from Notion needed yet - new submissions go to Firebase
- Old Notion environment variables can be removed once migration is complete

