# Google Calendar API Setup Guide

This application uses Google Calendar API to sync private events (approved events that are NOT public) and committee meetings to Google Calendar.

## Prerequisites

1. A Google account: `bwccinternalcalendar@gmail.com`
2. Google Cloud Project with Calendar API enabled
3. Service Account credentials (same as Firebase Admin)

## Setup Steps

### 1. Enable Google Calendar API

**CRITICAL**: The Calendar API must be enabled in the **same project** where your service account belongs.

Your service account is: `firebase-adminsdk-fbsvc@bwccworkspace.iam.gserviceaccount.com`

This means the service account belongs to project **`bwccworkspace`** (no hyphen).

**You MUST enable the Calendar API in the `bwccworkspace` project**, NOT in `bwcc-workspace` (with hyphen).

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Select the project with ID `bwccworkspace`** (NOT `bwcc-workspace`)
   - Check the project dropdown at the top - make sure you see `bwccworkspace` as the project ID
   - If you see `bwcc-workspace` selected, that's the WRONG project - switch to `bwccworkspace`
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Calendar API"
5. Click **Enable**
6. Wait 2-5 minutes for the API to be fully enabled and propagate through Google's systems

**To verify you're in the correct project:**
- Look at the project dropdown - it should show project ID `bwccworkspace`
- Your service account email should match: `*@bwccworkspace.iam.gserviceaccount.com`

### 2. Share Calendar with Service Account

Since we're using a Gmail account (not Google Workspace), we need to share the calendar with the service account:

1. Go to [Google Calendar](https://calendar.google.com/)
2. Sign in as `bwccinternalcalendar@gmail.com`
3. Click the **Settings** (gear icon) > **Settings**
4. Click **Add calendar** > **Create new calendar** (or use the existing primary calendar)
5. Under **Share with specific people**, click **Add people**
6. Add the service account email: **`bwcc-workspace@bwcc-workspace.iam.gserviceaccount.com`**
7. Give it **Make changes to events** permission
8. Click **Send**

**Important**: The service account email must have access to the calendar. If you're using a different calendar, make sure to share it with this service account.

### 3. Update Calendar ID (Optional)

If you created a separate calendar (not the primary one):
1. Go to **Settings** > **Settings for my calendars** > Select your calendar
2. Scroll down to **Integrate calendar**
3. Copy the **Calendar ID** (usually the email address)
4. Update `CALENDAR_ID` in `lib/google-calendar/service.ts` if different from the email

### 4. Service Account Credentials

The application uses the same service account credentials as Firebase Admin. Make sure these are set in your environment variables:

**Option 1: Individual Environment Variables (Recommended)**
- `FIREBASE_CLIENT_EMAIL` - Service account email (e.g., `bwcc-workspace@bwcc-workspace.iam.gserviceaccount.com`)
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `FIREBASE_PROJECT_ID` - Project ID (should be `bwccworkspace`)

**Option 2: Service Account JSON File**
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file
  - The JSON file should contain `project_id: "bwccworkspace"`

**Option 3: Service Account JSON String**
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON as string

**Important**: The service account must belong to the "BWCC Workspace" project (project ID: `bwccworkspace`). If you see errors about project `941756101500` or a different project, verify that:
1. Your service account JSON file has `project_id: "bwccworkspace"`
2. The Calendar API is enabled in the "BWCC Workspace" project, not a different project

## How It Works

1. **Private Events**: When an event is created or updated with `status: "Approved"` and `isPublicEvent: false`, it's automatically synced to Google Calendar (`bwccinternalcalendar@gmail.com`)
2. **Committee Meetings**: All meetings are synced to Google Calendar
3. **Google Meet Links**: Google Meet URLs are automatically generated for new events and meetings
4. **Calendar Subscription**: Users subscribe to the private calendar via the calendar feed URL (shown on the Schedules page)
   - The feed URL: `/api/calendar/feed?private=true`
   - Users copy this URL and add it to their Google Calendar
   - Events automatically appear in their calendar when they subscribe
5. **Email Invites**: ⚠️ **Important Limitation**: Service accounts cannot add attendees or send email invites when using Gmail accounts (requires Google Workspace). Instead, users subscribe to the calendar feed to see events.

### Subscribing Users to Private Calendar

To add a user as an attendee to private calendar events:
1. Go to the user's document in the `users` collection in Firestore
2. Add or update the field: `subscribedToPrivateCalendar: true`
3. The user's email must be valid and present in the `email` field

Users without this field set to `true` will not receive calendar invites for private events.

## Event Deletion

If an event is deleted from the system or changed from private/approved to public, the corresponding Google Calendar event is automatically deleted.

## Troubleshooting

### Error: "Google Calendar API has not been used in project [NUMBER] before or it is disabled"

This error means the Calendar API is either:
1. Not enabled in the correct project, OR
2. The wrong project is being used

**Common Issue**: You may have two projects:
- `bwccworkspace` (no hyphen) - where your Firebase service account belongs
- `bwcc-workspace` (with hyphen) - a different project

**Solution:**
1. Check your service account email: `firebase-adminsdk-fbsvc@bwccworkspace.iam.gserviceaccount.com`
   - The domain `@bwccworkspace.iam.gserviceaccount.com` tells you the project ID is `bwccworkspace` (no hyphen)
2. Go to [Google Cloud Console](https://console.cloud.google.com/)
3. **Select the project with ID `bwccworkspace`** (NOT `bwcc-workspace`)
   - Look at the project dropdown - it should show `bwccworkspace` as the project ID
4. Navigate to **APIs & Services** > **Enabled APIs**
5. Search for "Google Calendar API"
6. If it's not listed, go to **APIs & Services** > **Library** and enable it
7. Wait 2-5 minutes for the API to propagate
8. Verify your service account JSON file has `project_id: "bwccworkspace"` (no hyphen, not a numeric ID)
9. Restart your development server after making changes

**Important**: The Calendar API must be enabled in the **same project** where your service account belongs (`bwccworkspace`), not in a different project.

### Error: "Calendar not found" or "Forbidden"

- Make sure the calendar is shared with the service account email
- Verify the service account email in your Firebase service account JSON matches the one you shared the calendar with
- Check that the Calendar API is enabled in the **correct** Google Cloud project ("BWCC Workspace")

### Error: "Insufficient Permission"

- Ensure the service account has "Make changes to events" permission on the shared calendar
- Verify the service account has the Calendar API scope enabled

### Events Not Appearing

- Check server logs for Google Calendar sync errors
- Verify the event meets the criteria: `status: "Approved"` AND `isPublicEvent: false`
- Ensure the event has a `startTime` or `date` field set
- Check that user emails in the `users` collection are valid
- Verify users have `subscribedToPrivateCalendar: true` if you expect them to receive invites

## Testing

1. Create a test event with:
   - `status: "Approved"`
   - `isPublicEvent: false`
   - `startTime` or `date` set
   - `eventTitle` set

2. Check the calendar at `bwccinternalcalendar@gmail.com` - the event should appear

3. Check user emails - they should receive calendar invites

