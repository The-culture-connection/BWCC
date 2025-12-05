import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includePrivate = searchParams.get('private') === 'true';

    const notionApiKey = process.env.NOTION_API_KEY;
    const eventsDatabaseId = process.env.NOTION_EVENTS_DATABASE_ID;

    if (!notionApiKey || !eventsDatabaseId) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Build filter based on status and public event
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

    // If not including private, only show public events
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
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      return NextResponse.json(
        { error: `Failed to fetch events: ${errorData.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform Notion results to simplified event format
    const events = data.results.map((page: any) => {
      const props = page.properties;
      
      // Extract Event Title
      const title = props['Event Title']?.title?.[0]?.text?.content || 'Untitled Event';
      
      // Extract Purpose
      const purpose = props['Purpose']?.rich_text?.[0]?.text?.content || '';
      
      // Extract Start Time
      let startTime = null;
      if (props['Start Time']?.date) {
        startTime = props['Start Time'].date.start;
      } else if (props['Date']?.date) {
        startTime = props['Date'].date.start;
      }
      
      // Extract Location
      const location = props['Location']?.rich_text?.[0]?.text?.content || '';
      
      // Extract Date for calendar
      const date = props['Date']?.date?.start || '';
      
      // Extract Public Event status
      const isPublic = props['Public Event?']?.checkbox || false;
      
      return {
        id: page.id,
        title,
        purpose,
        startTime,
        location,
        date,
        isPublic,
      };
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

