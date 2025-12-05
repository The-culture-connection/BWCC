import { NextRequest, NextResponse } from 'next/server';

// Generate iCal feed for calendar subscription
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Determine if private based on URL path or query params
    const isPrivateFeed = pathname.includes('/private');
    const searchParams = request.nextUrl.searchParams;
    const includePrivate = isPrivateFeed || searchParams.get('private') === 'true';
    const password = searchParams.get('password');

    // Check password for private events
    if (includePrivate && password !== 'BWCC2025') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const notionApiKey = process.env.NOTION_API_KEY;
    const eventsDatabaseId = process.env.NOTION_EVENTS_DATABASE_ID;

    if (!notionApiKey || !eventsDatabaseId) {
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Build filter
    let filter: any = {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Approved',
          },
        },
      ],
    };

    if (!includePrivate) {
      filter.and.push({
        property: 'Public Event?',
        checkbox: {
          equals: true,
        },
      });
    }

    // Query Notion database
    const response = await fetch(`https://api.notion.com/v1/databases/${eventsDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: filter,
        sorts: [
          {
            property: 'Date',
            direction: 'ascending',
          },
        ],
      }),
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch events', { status: 500 });
    }

    const data = await response.json();
    
    // Debug: Log number of events found
    console.log(`Found ${data.results.length} events from Notion (filtered for Approved status)`);

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

    // Format date-only for iCal (no time, DATE format)
    const formatICSDateOnly = (dateStr: string): string => {
      if (!dateStr) return '';
      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = dateStr.split('T')[0];
      if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        return dateOnly.replace(/-/g, '');
      }
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        // Convert to EST and get date only
        const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const year = estDate.getFullYear();
        const month = String(estDate.getMonth() + 1).padStart(2, '0');
        const day = String(estDate.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      } catch (error) {
        return '';
      }
    };

    // Determine calendar name - ensure consistent formatting
    const calendarName = includePrivate ? 'BWCC - Private' : 'BWCC - Public';
    const calendarDesc = includePrivate 
      ? 'Black Women Cultivating Change - Private Events Calendar' 
      : 'Black Women Cultivating Change - Public Events Calendar';

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

    // Filter and process events
    const events = data.results.filter((page: any) => {
      const props = page.properties;
      const startDate = props['Start Time']?.date?.start || props['Date']?.date?.start || '';
      if (!startDate) {
        console.log('Skipping event without date:', props['Event Title']?.title?.[0]?.text?.content || 'Untitled');
      }
      return !!startDate;
    });

    console.log(`Processing ${events.length} events with valid dates`);

    if (events.length === 0) {
      // Return empty calendar if no events
      icsContent += `END:VCALENDAR${crlf}`;
      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="bwcc-events.ics"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    events.forEach((page: any) => {
      const props = page.properties;
      const title = props['Event Title']?.title?.[0]?.text?.content || 'Untitled Event';
      const purpose = props['Purpose']?.rich_text?.[0]?.text?.content || '';
      const location = props['Location']?.rich_text?.[0]?.text?.content || '';
      
      // Get start date/time - prefer Start Time, fall back to Date
      let startDate = props['Start Time']?.date?.start || props['Date']?.date?.start || '';
      const startDateType = props['Start Time']?.date ? 'datetime' : (props['Date']?.date ? 'date' : null);
      
      // Get end date/time
      let endDate = props['End Time']?.date?.start || '';
      
      if (!startDate) {
        console.log(`Skipping ${title} - no start date`);
        return;
      }
      
      // Check if event is public (only relevant for public feed)
      const isPublic = props['Public Event?']?.checkbox ?? false;
      
      // Double-check public filter (should already be filtered, but just in case)
      if (!includePrivate && !isPublic) {
        console.log(`Skipping ${title} - not public (isPublic: ${isPublic})`);
        return;
      }
      
      console.log(`Processing event: ${title}, Start: ${startDate}, End: ${endDate || 'none'}, Public: ${isPublic}, Status: ${props['Status']?.select?.name || 'unknown'}`);
      
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
      
      const uid = `${page.id.replace(/-/g, '')}@bwcc.org`;
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

    icsContent += `END:VCALENDAR${crlf}`;

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${calendarName.replace(/\s+/g, '-').toLowerCase()}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache - ensure fresh data
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Calendar feed error:', error);
    return new NextResponse('Error generating calendar feed', { status: 500 });
  }
}

