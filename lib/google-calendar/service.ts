/**
 * Google Calendar API Service
 * Creates, updates, and deletes events in Google Calendar for private events
 */

import { google } from 'googleapis';
import { Event, Meeting } from '@/lib/types/database';

const CALENDAR_EMAIL = 'bwccinternalcalendar@gmail.com';
const CALENDAR_ID = CALENDAR_EMAIL; // For primary calendar, the ID is the email

// Initialize Google Calendar client
async function getCalendarClient() {
  try {
    // Use the same service account credentials as Firebase Admin
    // The service account needs calendar access or domain-wide delegation
    const credentials = await getServiceAccountCredentials();
    
    if (!credentials) {
      throw new Error('Google service account credentials not found');
    }

    // Create JWT client for service account authentication
    // Note: For Gmail accounts, the calendar must be shared with the service account email
    // Domain-wide delegation (subject parameter) only works with Google Workspace
    // IMPORTANT: The project_id must match the project where the service account belongs
    // The service account email domain shows which project it belongs to
    const projectId = credentials.project_id || 'bwccworkspace';
    console.log(`Google Calendar: Using project ID: ${projectId}`);
    console.log(`Google Calendar: Using service account: ${credentials.client_email}`);
    console.log(`Google Calendar: Make sure Calendar API is enabled in project: ${projectId}`);
    
    // Extract project ID from service account email
    // Service account format: *@PROJECT_ID.iam.gserviceaccount.com
    const emailProjectId = credentials.client_email.match(/@([^.]+)\.iam\.gserviceaccount\.com/)?.[1];
    
    // Use the project ID from the service account email if available, as it's the source of truth
    const actualProjectId = emailProjectId || projectId;
    
    if (emailProjectId && emailProjectId !== projectId) {
      console.warn(`Google Calendar: Warning - Project ID mismatch! Service account belongs to '${emailProjectId}' but credentials specify '${projectId}'`);
      console.warn(`Google Calendar: Using project ID from service account email: '${emailProjectId}'`);
    }
    
    console.log(`Google Calendar: Final project ID being used: ${actualProjectId}`);
    
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      projectId: actualProjectId, // Use the project ID from service account email
      // For Gmail accounts, we don't use 'subject' - the calendar must be shared instead
      // subject: CALENDAR_EMAIL, // Only for Google Workspace with domain-wide delegation
    });

    const calendar = google.calendar({ version: 'v3', auth });
    return calendar;
  } catch (error) {
    console.error('Error initializing Google Calendar client:', error);
    throw error;
  }
}

// Get service account credentials from environment
async function getServiceAccountCredentials(): Promise<{
  client_email: string;
  private_key: string;
  project_id: string;
} | null> {
  // Try to get from Firebase service account credentials
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    if (!adminDb) return null;

    // Get credentials from environment variables (same as Firebase Admin)
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (clientEmail && privateKey && projectId) {
      let cleanedPrivateKey = privateKey.trim();
      if ((cleanedPrivateKey.startsWith('"') && cleanedPrivateKey.endsWith('"')) ||
          (cleanedPrivateKey.startsWith("'") && cleanedPrivateKey.endsWith("'"))) {
        cleanedPrivateKey = cleanedPrivateKey.slice(1, -1);
      }
      cleanedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');

      return {
        client_email: clientEmail.trim(),
        private_key: cleanedPrivateKey,
        project_id: projectId.trim(),
      };
    }

    // Fallback to service account file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const fs = await import('fs');
      const path = await import('path');
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);

      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        return {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
          project_id: serviceAccount.project_id || 'bwccworkspace',
        };
      }
    }
  } catch (error) {
    console.error('Error getting service account credentials:', error);
  }

  return null;
}

// Get all user emails for private calendar subscribers
async function getSubscriberEmails(): Promise<string[]> {
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    if (!adminDb) return [];

    const usersSnapshot = await adminDb.collection('users').get();
    const emails = usersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Only include users who have subscribed to private calendar
        if (data.subscribedToPrivateCalendar === true && data.email) {
          return data.email;
        }
        return null;
      })
      .filter((email: string | null): email is string => !!email && typeof email === 'string');

    return emails;
  } catch (error) {
    console.error('Error fetching subscriber emails:', error);
    return [];
  }
}

// Convert Date to RFC3339 format for Google Calendar
function formatDateForGoogleCalendar(date: Date): string {
  return date.toISOString();
}

// Create or update a Google Calendar event for a private event
export async function syncEventToGoogleCalendar(
  event: Event,
  isUpdate: boolean = false
): Promise<string | null> {
  try {
    // Only sync private events (approved events that are NOT public)
    if (!event.status || event.status !== 'Approved' || event.isPublicEvent) {
      // If event is no longer private/approved, delete from Google Calendar if it exists
      if (event.googleCalendarEventId) {
        await deleteEventFromGoogleCalendar(event.googleCalendarEventId);
      }
      return null;
    }

    if (!event.startTime && !event.date) {
      console.log('Event has no start time or date, skipping Google Calendar sync');
      return null;
    }

    const calendar = await getCalendarClient();
    const subscriberEmails = await getSubscriberEmails();

    const startDate = event.startTime || event.date!;
    const endDate = event.endTime || (() => {
      // Default to 1 hour after start if no end time
      const end = new Date(startDate);
      end.setHours(end.getHours() + 1);
      return end;
    })();

    const calendarEvent: any = {
      summary: event.eventTitle,
      description: [
        event.purpose && `Purpose: ${event.purpose}`,
        event.description && `Description: ${event.description}`,
        event.location && `Location: ${event.location}`,
        event.eventType && `Type: ${event.eventType}`,
        event.virtualMeetingLink && `\nVirtual Meeting:\n${event.virtualMeetingLink}`,
      ].filter(Boolean).join('\n\n'),
      location: event.location || undefined,
      start: {
        dateTime: formatDateForGoogleCalendar(startDate),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: formatDateForGoogleCalendar(endDate),
        timeZone: 'America/New_York',
      },
      // Add Google Meet link
      conferenceData: {
        createRequest: {
          requestId: `meet-${event.id || Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      conferenceDataVersion: 1,
      // Note: Service accounts cannot include attendees with Gmail accounts (requires Google Workspace)
      // We must omit attendees - users who subscribe to the calendar will see the events
      // attendees: subscriberEmails.map(email => ({ email })), // Removed - not supported with Gmail
    };

    let eventId: string;

    let meetLink: string | undefined;
    
    if (isUpdate && event.googleCalendarEventId) {
      // Update existing event
      const response = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: event.googleCalendarEventId,
        requestBody: calendarEvent,
        conferenceDataVersion: 1,
      });
      eventId = response.data.id || event.googleCalendarEventId;
      meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || undefined;
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: calendarEvent,
        conferenceDataVersion: 1,
      });
      eventId = response.data.id || '';
      meetLink = (response.data.conferenceData?.entryPoints?.[0]?.uri) || undefined;
      console.log(`✅ Event created successfully on Google Calendar`);
      console.log(`   Event ID: ${eventId}`);
      console.log(`   Calendar: ${CALENDAR_ID}`);
      console.log(`   Title: ${event.eventTitle}`);
      if (meetLink) {
        console.log(`   Google Meet Link: ${meetLink}`);
      }
    }

    // Return both event ID and meet link (caller should store meet link in event document)
    return eventId;
  } catch (error: any) {
    console.error('❌ Error syncing event to Google Calendar:', error);
    
    // Provide helpful error message for Calendar API not enabled
    if (error.code === 403 && error.message?.includes('has not been used in project')) {
      const projectMatch = error.message.match(/project (\d+)/);
      if (projectMatch) {
        const projectNumber = projectMatch[1];
        console.error(`\n❌ Calendar API Error:`);
        console.error(`   The Calendar API is not enabled in the project where your service account belongs.`);
        console.error(`   Project number from error: ${projectNumber}`);
        console.error(`\n   To fix this:`);
        console.error(`   1. Go to https://console.cloud.google.com/`);
        console.error(`   2. Find the project that contains your service account`);
        console.error(`   3. Enable the Calendar API in that project`);
        console.error(`   4. The project number ${projectNumber} might be the numeric ID for your project`);
        console.error(`\n   Your service account email shows which project it belongs to:`);
        console.error(`   Format: *@PROJECT_ID.iam.gserviceaccount.com`);
      }
    }
    
    // Provide helpful error message for service account invite limitation
    if (error.code === 403 && error.message?.includes('cannot invite attendees')) {
      console.error(`\n❌ Service Account Limitation:`);
      console.error(`   Service accounts cannot include attendees in events when using Gmail accounts.`);
      console.error(`   This requires Google Workspace with Domain-Wide Delegation.`);
      console.error(`\n   Events will be created without attendees. Users who subscribe to the calendar will see events.`);
      console.error(`   To add attendees, you would need to use Google Workspace or manually add them in Google Calendar.`);
    }
    
    // Provide helpful error message for Calendar not found (404)
    if (error.code === 404) {
      console.error(`\n❌ Calendar Not Found Error:`);
      console.error(`   The calendar "${CALENDAR_ID}" cannot be accessed by the service account.`);
      console.error(`\n   This usually means the calendar hasn't been shared with the service account.`);
      console.error(`\n   To fix this:`);
      console.error(`   1. Go to https://calendar.google.com/`);
      console.error(`   2. Sign in as: ${CALENDAR_EMAIL}`);
      console.error(`   3. Click Settings (gear icon) > Settings`);
      console.error(`   4. Click "Settings for my calendars" > Select the calendar`);
      console.error(`   5. Scroll to "Share with specific people"`);
      console.error(`   6. Click "Add people"`);
      console.error(`   7. Add the service account email: firebase-adminsdk-fbsvc@bwccworkspace.iam.gserviceaccount.com`);
      console.error(`   8. Give it "Make changes to events" permission`);
      console.error(`   9. Click "Send"`);
      console.error(`\n   After sharing, wait a minute and try again.`);
    }
    
    // Don't throw - allow the event to be saved even if Google Calendar sync fails
    return null;
  }
}

// Create or update a Google Calendar event for a meeting
export async function syncMeetingToGoogleCalendar(
  meeting: Meeting,
  isUpdate: boolean = false
): Promise<string | null> {
  try {
    const calendar = await getCalendarClient();
    const subscriberEmails = await getSubscriberEmails();

    if (!meeting.startTime && !meeting.date) {
      console.log('Meeting has no start time or date, skipping Google Calendar sync');
      return null;
    }

    const startDate = meeting.startTime || meeting.date;
    const endDate = meeting.endTime || (() => {
      const end = new Date(startDate);
      end.setHours(end.getHours() + 1);
      return end;
    })();

    const calendarEvent: any = {
      summary: meeting.title,
      description: [
        meeting.description,
        meeting.virtualMeetingLink && `\nVirtual Meeting:\n${meeting.virtualMeetingLink}`,
      ].filter(Boolean).join('\n\n') || undefined,
      location: meeting.location || undefined,
      start: {
        dateTime: formatDateForGoogleCalendar(startDate),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: formatDateForGoogleCalendar(endDate),
        timeZone: 'America/New_York',
      },
      // Add Google Meet link
      conferenceData: {
        createRequest: {
          requestId: `meet-${meeting.id || Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      conferenceDataVersion: 1,
      // Note: Service accounts cannot include attendees with Gmail accounts (requires Google Workspace)
      // We must omit attendees - users who subscribe to the calendar will see the events
      // attendees: subscriberEmails.map(email => ({ email })), // Removed - not supported with Gmail
    };

    let eventId: string;

    let meetLink: string | undefined;
    
    if (isUpdate && meeting.googleCalendarEventId) {
      // Update existing meeting
      const response = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: meeting.googleCalendarEventId,
        requestBody: calendarEvent,
        conferenceDataVersion: 1,
      });
      eventId = response.data.id || meeting.googleCalendarEventId;
      meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || undefined;
    } else {
      // Create new meeting
      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: calendarEvent,
        conferenceDataVersion: 1,
      });
      eventId = response.data.id || '';
      meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || undefined;
      console.log(`Meeting created successfully on Google Calendar: ${eventId}`);
      if (meetLink) {
        console.log(`   Google Meet Link: ${meetLink}`);
      }
    }

    // Return both event ID and meet link (caller should store meet link in meeting document)
    return eventId;
  } catch (error: any) {
    console.error('Error syncing meeting to Google Calendar:', error);
    return null;
  }
}

// Get Google Meet link from a calendar event
export async function getGoogleMeetLink(calendarEventId: string): Promise<string | null> {
  try {
    const calendar = await getCalendarClient();
    const response = await calendar.events.get({
      calendarId: CALENDAR_ID,
      eventId: calendarEventId,
    });
    
    const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
    return meetLink || null;
  } catch (error: any) {
    console.error('Error getting Google Meet link:', error);
    return null;
  }
}

// Delete an event from Google Calendar
export async function deleteEventFromGoogleCalendar(eventId: string): Promise<void> {
  try {
    const calendar = await getCalendarClient();
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });
  } catch (error: any) {
    // If event doesn't exist (404), that's okay - it's already deleted
    if (error.code === 404) {
      console.log('Event not found in Google Calendar (already deleted)');
      return;
    }
    console.error('Error deleting event from Google Calendar:', error);
    // Don't throw - allow deletion to continue even if Google Calendar delete fails
  }
}

