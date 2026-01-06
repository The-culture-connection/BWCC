import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterSignups, getVolunteers } from '@/lib/firebase/db';
import { adminDb } from '@/lib/firebase/admin';
import { convertTimestamps } from '@/lib/firebase/db';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Handle arrays and objects
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`;
      }
      if (value && typeof value === 'object') {
        return `"${JSON.stringify(value)}"`;
      }
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
  });
  
  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'newsletter', 'volunteers', 'requests', 'events', 'people'

    if (!type) {
      return NextResponse.json({ error: 'Export type is required' }, { status: 400 });
    }

    let csv = '';
    let filename = '';

    switch (type) {
      case 'newsletter':
        const signups = await getNewsletterSignups();
        csv = convertToCSV(signups.map(s => ({
          name: s.name,
          email: s.email,
          subscribedAt: s.subscribedAt?.toISOString() || '',
          isActive: s.isActive,
        })));
        filename = `newsletter-signups-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'volunteers':
        // Source volunteers from people collection where role is "Volunteer"
        if (!adminDb) throw new Error('Firebase Admin not initialized');
        const volunteersSnapshot = await adminDb.collection('people')
          .where('role', '==', 'Volunteer')
          .orderBy('createdAt', 'desc')
          .get();
        const volunteers = volunteersSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
        csv = convertToCSV(volunteers.map((v: any) => ({
          id: v.id || '',
          name: v.name || '',
          email: v.email || '',
          phone: v.phone || '',
          role: v.role || '',
          status: v.status || '',
          organization: v.organization || '',
          expertiseAreas: Array.isArray(v.expertiseAreas) ? v.expertiseAreas.join('; ') : '',
          assignedEventId: v.assignedEventId || '',
          relatedEventIds: Array.isArray(v.relatedEventIds) ? v.relatedEventIds.join('; ') : '',
          relatedTaskIds: Array.isArray(v.relatedTaskIds) ? v.relatedTaskIds.join('; ') : '',
          sendConfirmationEmail: v.sendConfirmationEmail || false,
          createdAt: v.createdAt?.toISOString() || '',
          updatedAt: v.updatedAt?.toISOString() || '',
        })));
        filename = `volunteers-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'requests':
        if (!adminDb) throw new Error('Firebase Admin not initialized');
        const requestsSnapshot = await adminDb.collection('requests')
          .orderBy('createdAt', 'desc')
          .get();
        const requests = requestsSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
        csv = convertToCSV(requests.map((r: any) => ({
          id: r.id,
          requestTitle: r.requestTitle || '',
          requestType: r.requestType || '',
          status: r.status || '',
          decision: r.decision || '',
          name: r.name || '',
          organization: r.organization || '',
          email: r.email || '',
          phone: r.phone || '',
          details: r.details || '',
          createdAt: r.createdAt?.toISOString() || '',
        })));
        filename = `requests-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'events':
        if (!adminDb) throw new Error('Firebase Admin not initialized');
        const eventsSnapshot = await adminDb.collection('events')
          .orderBy('date', 'desc')
          .get();
        const events = eventsSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
        csv = convertToCSV(events.map((e: any) => ({
          id: e.id,
          eventTitle: e.eventTitle || '',
          eventType: e.eventType || '',
          status: e.status || '',
          date: e.date?.toISOString() || '',
          startTime: e.startTime?.toISOString() || '',
          endTime: e.endTime?.toISOString() || '',
          location: e.location || '',
          isPublicEvent: e.isPublicEvent || false,
          purpose: e.purpose || '',
          createdAt: e.createdAt?.toISOString() || '',
        })));
        filename = `events-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'people':
        if (!adminDb) throw new Error('Firebase Admin not initialized');
        const peopleSnapshot = await adminDb.collection('people')
          .orderBy('createdAt', 'desc')
          .get();
        const people = peopleSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
        csv = convertToCSV(people.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          role: p.role || '',
          email: p.email || '',
          phone: p.phone || '',
          organization: p.organization || '',
          expertiseAreas: p.expertiseAreas?.join('; ') || '',
          createdAt: p.createdAt?.toISOString() || '',
        })));
        filename = `people-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    );
  }
}

