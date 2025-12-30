import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/firebase/db';
import { Event } from '@/lib/types/database';
import { adminDb } from '@/lib/firebase/admin';
import { Meeting } from '@/lib/types/database';
import { convertTimestamps } from '@/lib/firebase/db';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate iCal feed for calendar subscription
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Determine if private based on query params
    const includePrivate = searchParams.get('private') === 'true';

    // Get events from Firebase
    // Private calendar: all events (no status filter) + meetings
    // Public calendar: only approved and public events
    let events: Event[] = [];
    let meetings: Meeting[] = [];
    
    if (includePrivate) {
      // Private calendar shows ALL events with status "Approved" + meetings
      // Fetch all events, then filter for Approved status
      if (!adminDb) throw new Error('Firebase Admin not initialized');
      const eventsSnapshot = await adminDb.collection('events')
        .orderBy('date', 'asc')
        .get();
      const allEvents = eventsSnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() } as Event)
      );
      // Filter for Approved events only
      events = allEvents.filter(event => event.status === 'Approved');
      
      // Also fetch meetings for private calendar
      try {
        const meetingsSnapshot = await adminDb.collection('meetings')
          .orderBy('date', 'desc')
          .get();
        meetings = meetingsSnapshot.docs.map(doc => 
          convertTimestamps({ id: doc.id, ...doc.data() } as Meeting)
        );
      } catch (error) {
        console.error('Error fetching meetings for calendar:', error);
      }
    } else {
      // Public calendar: only approved + public events (no meetings)
      // Fetch events that are both Approved and isPublicEvent === true
      if (!adminDb) throw new Error('Firebase Admin not initialized');
      const allEventsSnapshot = await adminDb.collection('events')
        .orderBy('date', 'asc')
        .get();
      const allEvents = allEventsSnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() } as Event)
      );
      events = allEvents.filter(event => 
        event.status === 'Approved' && event.isPublicEvent === true
      );
    }
    
    // Debug: Log number of events found
    console.log(`Found ${events.length} events and ${meetings.length} meetings from Firebase${includePrivate ? ' (approved events + meetings for private calendar)' : ' (approved + public events for public calendar)'}`);

    // Convert date string to EST timezone and format for iCal (without timezone offset when using TZID)
    const formatICSDateEST = (dateStr: string): string => {
      if (!dateStr) return '';
      
      try {
        // Parse the date string - Notion dates might have timezone info
        let date: Date;
        
        // Check if it's a date-only string (YYYY-MM-DD)
        const dateOnlyMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
        
        if (dateOnlyMatch) {
          // If it includes a timezone offset, parse it directly
          if (dateStr.includes('-05:00') || dateStr.includes('-04:00') || dateStr.includes('+')) {
            // Parse as is (already has timezone info)
            date = new Date(dateStr);
          } else if (dateStr.includes('T')) {
            // Has time but no timezone, treat as EST/EDT
            // Notion stores times in the database timezone, which should be EST
            // Add EST timezone to ensure correct parsing
            const timePart = dateStr.split('T')[1] || '00:00:00';
            // Default to EST (UTC-5), but we'll convert properly below
            date = new Date(dateStr);
          } else {
            // Date-only, treat as EST at 9 AM
            date = new Date(`${dateStr}T09:00:00-05:00`);
          }
        } else {
          date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
          console.error('Invalid date:', dateStr);
          return '';
        }
        
        // Convert to EST/EDT (America/New_York timezone)
        // Format the date components in EST (without timezone offset when using TZID)
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        
        const parts = formatter.formatToParts(date);
        const year = parts.find(p => p.type === 'year')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        const hours = parts.find(p => p.type === 'hour')?.value || '';
        const minutes = parts.find(p => p.type === 'minute')?.value || '';
        const seconds = parts.find(p => p.type === 'second')?.value || '';
        
        // Format: YYYYMMDDTHHmmss (no timezone offset when using TZID)
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
      } catch (error) {
        console.error('Error formatting date:', dateStr, error);
        return '';
      }
    };

    // Format date-only for iCal (no time, DATE format) in Eastern timezone
    const formatICSDateOnly = (dateStr: string): string => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        // Convert to Eastern Time and get date components
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        
        const parts = formatter.formatToParts(date);
        const year = parts.find(p => p.type === 'year')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        
        return `${year}${month}${day}`;
      } catch (error) {
        return '';
      }
    };

    // Determine calendar name - ensure consistent formatting
    const calendarName = includePrivate ? 'BWCCcal-private' : 'BWCCcal-public';
    const calendarDesc = includePrivate 
      ? 'Black Women Cultivating Change - Private Events Calendar (includes all events and meetings)' 
      : 'Black Women Cultivating Change - Public Events Calendar (approved public events only)';

    // Build iCal content with proper line breaks (CRLF)
    const crlf = '\r\n';
    let icsContent = `BEGIN:VCALENDAR${crlf}`;
    icsContent += `VERSION:2.0${crlf}`;
    icsContent += `PRODID:-//Black Women Cultivating Change//${calendarName}//EN${crlf}`;
    icsContent += `CALSCALE:GREGORIAN${crlf}`;
    icsContent += `METHOD:PUBLISH${crlf}`;
    // Calendar name properties - Google Calendar should pick up X-WR-CALNAME
    // Note: Some calendar apps may require manual renaming in their settings
    icsContent += `X-WR-CALNAME:${calendarName}${crlf}`;
    icsContent += `X-WR-CALDESC:${calendarDesc}${crlf}`;
    icsContent += `X-WR-TIMEZONE:America/New_York${crlf}`;
    icsContent += `X-APPLE-CALENDAR-COLOR:#FFA500${crlf}`;
    icsContent += `X-WR-RELCALID:${calendarName.replace(/\s+/g, '-')}@bwcc.org${crlf}`;
    
    // Add VTIMEZONE definition for EST/EDT
    icsContent += `BEGIN:VTIMEZONE${crlf}`;
    icsContent += `TZID:America/New_York${crlf}`;
    icsContent += `X-LIC-LOCATION:America/New_York${crlf}`;
    icsContent += `BEGIN:DAYLIGHT${crlf}`;
    icsContent += `TZOFFSETFROM:-0500${crlf}`;
    icsContent += `TZOFFSETTO:-0400${crlf}`;
    icsContent += `TZNAME:EDT${crlf}`;
    icsContent += `DTSTART:19700308T020000${crlf}`;
    icsContent += `RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU${crlf}`;
    icsContent += `END:DAYLIGHT${crlf}`;
    icsContent += `BEGIN:STANDARD${crlf}`;
    icsContent += `TZOFFSETFROM:-0400${crlf}`;
    icsContent += `TZOFFSETTO:-0500${crlf}`;
    icsContent += `TZNAME:EST${crlf}`;
    icsContent += `DTSTART:19701101T020000${crlf}`;
    icsContent += `RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU${crlf}`;
    icsContent += `END:STANDARD${crlf}`;
    icsContent += `END:VTIMEZONE${crlf}`;

    // Filter events that have valid dates
    const validEvents = events.filter((event: Event) => {
      const hasDate = !!(event.startTime || event.date);
      if (!hasDate) {
        console.log('Skipping event without date:', event.eventTitle || 'Untitled');
      }
      return hasDate;
    });

    // Filter meetings that have valid dates (only for private calendar)
    const validMeetings = includePrivate ? meetings.filter((meeting: Meeting) => {
      const hasDate = !!(meeting.startTime || meeting.date);
      if (!hasDate) {
        console.log('Skipping meeting without date:', meeting.title || 'Untitled');
      }
      return hasDate;
    }) : [];

    console.log(`Processing ${validEvents.length} events and ${validMeetings.length} meetings with valid dates`);

    if (validEvents.length === 0 && validMeetings.length === 0) {
      // Return empty calendar if no events or meetings
      icsContent += `END:VCALENDAR${crlf}`;
      return new NextResponse(icsContent, {
        headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="bwcc-events.ics"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // Prevent caching for dynamic updates
        'Access-Control-Allow-Origin': '*', // Allow calendar subscriptions from any domain
        'Access-Control-Allow-Methods': 'GET',
        },
      });
    }

    validEvents.forEach((event: Event) => {
      const title = event.eventTitle || 'Untitled Event';
      const purpose = event.purpose || '';
      const location = event.location || '';
      
      // Get start date/time - prefer startTime, fall back to date
      const startDateObj = event.startTime || event.date;
      if (!startDateObj) {
        console.log(`Skipping ${title} - no start date`);
        return;
      }
      
      // Convert to Date object and then to ISO string
      // The date is stored in Firestore, so we need to handle it properly
      let startDateParsed: Date;
      if (startDateObj instanceof Date) {
        startDateParsed = startDateObj;
      } else {
        startDateParsed = new Date(startDateObj);
      }
      const startDate = startDateParsed.toISOString();
      const startDateType = event.startTime ? 'datetime' : (event.date ? 'date' : null);
      
      // Get end date/time
      let endDateParsed: Date | null = null;
      if (event.endTime) {
        if (event.endTime instanceof Date) {
          endDateParsed = event.endTime;
        } else {
          endDateParsed = new Date(event.endTime);
        }
      }
      const endDate = endDateParsed ? endDateParsed.toISOString() : '';
      
      // Double-check public filter (should already be filtered, but just in case)
      if (!includePrivate && !event.isPublicEvent) {
        console.log(`Skipping ${title} - not public`);
        return;
      }
      
      console.log(`Processing event: ${title}, Start: ${startDate}, End: ${endDate || 'none'}, Public: ${event.isPublicEvent}`);
      
      // Determine if this is a date-only or datetime event
      const isDateOnly = startDateType === 'date' && !startDate.includes('T');
      
      // If no end date, default to 1 hour after start (or end of day for date-only)
      if (!endDate) {
        if (isDateOnly) {
          // For date-only events, set end to same day
          endDate = startDate.split('T')[0] + 'T23:59:59';
        } else {
          const start = new Date(startDate);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          endDate = end.toISOString();
        }
      }
      
      const uid = `${(event.id || '').replace(/-/g, '')}@bwcc.org`;
      // DTSTAMP should be in UTC
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      // Format start/end dates appropriately with EST timezone
      let dtstart: string;
      let dtend: string;
      
      if (isDateOnly) {
        dtstart = formatICSDateOnly(startDate);
        const endDateOnly = endDate.split('T')[0];
        dtend = formatICSDateOnly(endDateOnly);
      } else {
        dtstart = formatICSDateEST(startDate);
        dtend = formatICSDateEST(endDate);
      }
      
      if (!dtstart || !dtend) return; // Skip if date formatting failed
      
      // Escape special characters for iCal (more comprehensive)
      const escapeText = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/\\/g, '\\\\')
          .replace(/,/g, '\\,')
          .replace(/;/g, '\\;')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '');
      };
      
      // Fold long lines (iCal spec: lines should be max 75 chars, continued with space + CRLF)
      const foldLine = (line: string): string => {
        if (line.length <= 75) return line;
        let folded = '';
        let remaining = line;
        while (remaining.length > 75) {
          folded += remaining.substring(0, 75) + crlf + ' ';
          remaining = remaining.substring(75);
        }
        folded += remaining;
        return folded;
      };
      
      // Build event with proper formatting
      icsContent += `BEGIN:VEVENT${crlf}`;
      icsContent += foldLine(`UID:${uid}${crlf}`);
      icsContent += foldLine(`DTSTAMP:${dtstamp}${crlf}`);
      
      if (isDateOnly) {
        icsContent += foldLine(`DTSTART;VALUE=DATE:${dtstart}${crlf}`);
        icsContent += foldLine(`DTEND;VALUE=DATE:${dtend}${crlf}`);
      } else {
        // Use TZID for EST timezone - ensure proper formatting
        // Format: DTSTART;TZID=America/New_York:YYYYMMDDTHHmmss
        if (!dtstart || !dtend) {
          console.log(`Skipping event ${title} - invalid date format. dtstart: ${dtstart}, dtend: ${dtend}`);
          return;
        }
        icsContent += `DTSTART;TZID=America/New_York:${dtstart}${crlf}`;
        icsContent += `DTEND;TZID=America/New_York:${dtend}${crlf}`;
      }
      
      if (title) {
        icsContent += foldLine(`SUMMARY:${escapeText(title)}${crlf}`);
      }
      
      if (purpose) {
        icsContent += foldLine(`DESCRIPTION:${escapeText(purpose)}${crlf}`);
      }
      
      if (location) {
        icsContent += foldLine(`LOCATION:${escapeText(location)}${crlf}`);
      }
      
      icsContent += `STATUS:CONFIRMED${crlf}`;
      icsContent += `SEQUENCE:0${crlf}`;
      icsContent += `LAST-MODIFIED:${dtstamp}${crlf}`;
      icsContent += `END:VEVENT${crlf}`;
    });

    // Add meetings to private calendar (same format as events)
    validMeetings.forEach((meeting: Meeting) => {
      const title = meeting.title || 'Untitled Meeting';
      const description = meeting.description || '';
      const location = meeting.location || '';
      
      // Get start date/time - prefer startTime, fall back to date
      const startDateObj = meeting.startTime || meeting.date;
      if (!startDateObj) {
        console.log(`Skipping ${title} - no start date`);
        return;
      }
      
      // Convert to Date object and then to ISO string
      let startDateParsed: Date;
      if (startDateObj instanceof Date) {
        startDateParsed = startDateObj;
      } else {
        startDateParsed = new Date(startDateObj);
      }
      const startDate = startDateParsed.toISOString();
      const startDateType = meeting.startTime ? 'datetime' : (meeting.date ? 'date' : null);
      
      // Get end date/time
      let endDateParsed: Date | null = null;
      if (meeting.endTime) {
        if (meeting.endTime instanceof Date) {
          endDateParsed = meeting.endTime;
        } else {
          endDateParsed = new Date(meeting.endTime);
        }
      }
      const endDate = endDateParsed ? endDateParsed.toISOString() : '';
      
      console.log(`Processing meeting: ${title}, Start: ${startDate}, End: ${endDate || 'none'}`);
      
      // Determine if this is a date-only or datetime meeting
      const isDateOnly = startDateType === 'date' && !startDate.includes('T');
      
      // If no end date, default to 1 hour after start (or end of day for date-only)
      if (!endDate) {
        if (isDateOnly) {
          // For date-only meetings, set end to same day
          endDate = startDate.split('T')[0] + 'T23:59:59';
        } else {
          const start = new Date(startDate);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          endDate = end.toISOString();
        }
      }
      
      const uid = `meeting-${(meeting.id || '').replace(/-/g, '')}@bwcc.org`;
      // DTSTAMP should be in UTC
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      // Format start/end dates appropriately with EST timezone
      let dtstart: string;
      let dtend: string;
      
      if (isDateOnly) {
        dtstart = formatICSDateOnly(startDate);
        const endDateOnly = endDate.split('T')[0];
        dtend = formatICSDateOnly(endDateOnly);
      } else {
        dtstart = formatICSDateEST(startDate);
        dtend = formatICSDateEST(endDate);
      }
      
      if (!dtstart || !dtend) return; // Skip if date formatting failed
      
      // Escape special characters for iCal
      const escapeText = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/\\/g, '\\\\')
          .replace(/,/g, '\\,')
          .replace(/;/g, '\\;')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '');
      };
      
      // Fold long lines
      const foldLine = (line: string): string => {
        if (line.length <= 75) return line;
        let folded = '';
        let remaining = line;
        while (remaining.length > 75) {
          folded += remaining.substring(0, 75) + crlf + ' ';
          remaining = remaining.substring(75);
        }
        folded += remaining;
        return folded;
      };
      
      // Build meeting event
      icsContent += `BEGIN:VEVENT${crlf}`;
      icsContent += foldLine(`UID:${uid}${crlf}`);
      icsContent += foldLine(`DTSTAMP:${dtstamp}${crlf}`);
      
      if (isDateOnly) {
        icsContent += foldLine(`DTSTART;VALUE=DATE:${dtstart}${crlf}`);
        icsContent += foldLine(`DTEND;VALUE=DATE:${dtend}${crlf}`);
      } else {
        icsContent += `DTSTART;TZID=America/New_York:${dtstart}${crlf}`;
        icsContent += `DTEND;TZID=America/New_York:${dtend}${crlf}`;
      }
      
      if (title) {
        icsContent += foldLine(`SUMMARY:${escapeText(title)}${crlf}`);
      }
      
      if (description) {
        icsContent += foldLine(`DESCRIPTION:${escapeText(description)}${crlf}`);
      }
      
      if (location) {
        icsContent += foldLine(`LOCATION:${escapeText(location)}${crlf}`);
      }
      
      icsContent += `STATUS:CONFIRMED${crlf}`;
      icsContent += `SEQUENCE:0${crlf}`;
      icsContent += `LAST-MODIFIED:${dtstamp}${crlf}`;
      icsContent += `END:VEVENT${crlf}`;
    });

    icsContent += `END:VCALENDAR${crlf}`;

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${calendarName.replace(/\s+/g, '-').toLowerCase()}.ics"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // Prevent caching for dynamic updates
        'Access-Control-Allow-Origin': '*', // Allow calendar subscriptions from any domain
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('Calendar feed error:', error);
    return new NextResponse('Error generating calendar feed', { status: 500 });
  }
}

