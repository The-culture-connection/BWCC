import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Notion API integration
    // Try different possible environment variable names
    const notionApiKey = process.env.NOTION_API_KEY || process.env.NEXT_PUBLIC_NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID || process.env.NEXT_PUBLIC_NOTION_DATABASE_ID;

    console.log('Environment check:', {
      hasApiKey: !!notionApiKey,
      hasDatabaseId: !!notionDatabaseId,
      databaseIdLength: notionDatabaseId?.length,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('NOTION'))
    });

    if (!notionApiKey || !notionDatabaseId) {
      console.error('Notion API credentials not configured');
      console.error('Available env vars with NOTION:', Object.keys(process.env).filter(key => key.includes('NOTION')));
      return NextResponse.json(
        { 
          error: 'Server configuration error. Environment variables not found. Please ensure .env.local contains NOTION_API_KEY and NOTION_DATABASE_ID, then restart the server.',
          debug: {
            hasApiKey: !!notionApiKey,
            hasDatabaseId: !!notionDatabaseId
          }
        },
        { status: 500 }
      );
    }

    // Add page to Notion database
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: {
          database_id: notionDatabaseId,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: name,
                },
              },
            ],
          },
          Email: {
            email: email,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      return NextResponse.json(
        { error: `Failed to add to database: ${errorData.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
