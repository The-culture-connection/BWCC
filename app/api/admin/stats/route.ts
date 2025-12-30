import { NextRequest, NextResponse } from 'next/server';
import { getRequests, getEvents, getVolunteers, getNewsletterSignups } from '@/lib/firebase/db';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get counts for dashboard - handle errors gracefully
    let pendingRequests: any[] = [];
    let allEvents: any[] = [];
    let volunteers: any[] = [];
    let newsletterSignups: any[] = [];

    try {
      pendingRequests = await getRequests({ status: 'Pending' });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }

    try {
      allEvents = await getEvents({ status: 'Approved' });
    } catch (error) {
      console.error('Error fetching events:', error);
    }

    try {
      volunteers = await getVolunteers();
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }

    try {
      newsletterSignups = await getNewsletterSignups();
    } catch (error) {
      console.error('Error fetching newsletter signups:', error);
    }

    // Filter upcoming events (events with date in the future)
    const now = new Date();
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = event.date || event.startTime;
      return eventDate && new Date(eventDate) >= now;
    });

    const stats = {
      pendingRequests: pendingRequests?.length || 0,
      upcomingEvents: upcomingEvents?.length || 0,
      totalVolunteers: volunteers?.length || 0,
      newsletterSubscribers: newsletterSignups?.length || 0,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    // Return default stats on error instead of failing
    return NextResponse.json({
      stats: {
        pendingRequests: 0,
        upcomingEvents: 0,
        totalVolunteers: 0,
        newsletterSubscribers: 0,
      },
    }, { status: 200 });
  }
}

