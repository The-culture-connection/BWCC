import { NextRequest, NextResponse } from 'next/server';
import { createRequest, createEvent, createPerson, linkRequestToEvent, createVolunteer } from '@/lib/firebase/db';
import { buildRequest, buildEvent, buildPerson } from '@/lib/utils/request-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...formDataObj } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Involvement type is required' },
        { status: 400 }
      );
    }

    // Extract standard fields
    const name = formDataObj.name || '';
    const organization = formDataObj.organization || '';
    const email = formDataObj.email || '';
    const phone = formDataObj.phone || '';
    const moreInfoLink = formDataObj.moreInfoLink || '';

    // Types that should NOT create Request entries (only go to People & Partners)
    const skipRequestTypes = ['panelist', 'volunteer'];
    let requestId: string | null = null;

    // Create Request entry for applicable types
    if (!skipRequestTypes.includes(type)) {
      const requestData = buildRequest(type, formDataObj, name, organization, email, phone, moreInfoLink);
      requestId = await createRequest(requestData);
      console.log('Successfully created Request entry:', requestId);
    } else {
      console.log(`Skipping Request entry for type: ${type} (only creating People & Partners entry)`);
    }

    // Create Events & Activities entry for applicable types
    let eventId: string | null = null;
    const eventCreatingTypes = ['speak', 'listening', 'training', 'partner'];
    if (eventCreatingTypes.includes(type)) {
      try {
        const eventData = buildEvent(type, formDataObj, name, organization, requestId, moreInfoLink);
        if (eventData) {
          eventId = await createEvent(eventData);
          console.log('Successfully created Event entry:', eventId);

          // Update the Request entry to link to the Event (only if Request entry exists)
          if (requestId) {
            await linkRequestToEvent(requestId, eventId);
            console.log('Linked Request to Event');
          }
        }
      } catch (error: any) {
        console.error('Failed to create Event entry:', error);
        // Don't fail the whole request if event creation fails
      }
    }

    // Create People & Partners entry for applicable types
    const peopleCreatingTypes = ['partner', 'panelist', 'volunteer'];
    if (peopleCreatingTypes.includes(type)) {
      try {
        // For panelist/volunteer, check if an event is assigned
        const assignedEventId = formDataObj.assignedEventId || null;
        const personEventId = assignedEventId || eventId;
        
        const personData = buildPerson(type, formDataObj, name, organization, email, phone, personEventId, moreInfoLink, assignedEventId);
        if (personData) {
          const personId = await createPerson(personData);
          console.log('Successfully created People & Partners entry:', personId);
          
          // CRITICAL: Link person to event bidirectionally - MUST save to event document
          // This ensures people appear in the event detail page
          if (personEventId && personId) {
            try {
              const { adminDb } = await import('@/lib/firebase/admin');
              const { Timestamp } = await import('firebase-admin/firestore');
              if (!adminDb) {
                console.error('Admin DB not available for linking person to event');
                throw new Error('Admin DB not initialized');
              }
              
              console.log(`[LINK] Attempting to link person ${personId} to event ${personEventId}`);
              const eventRef = adminDb.collection('events').doc(personEventId);
              const eventDoc = await eventRef.get();
              
              if (!eventDoc.exists) {
                console.error(`[LINK] ERROR: Event ${personEventId} does not exist, cannot link person ${personId}`);
              } else {
                const eventData = eventDoc.data();
                // Ensure relatedPersonIds is an array (handle undefined/null)
                const relatedPersonIds = Array.isArray(eventData?.relatedPersonIds) 
                  ? [...eventData.relatedPersonIds] 
                  : [];
                
                // Only add if not already present
                if (!relatedPersonIds.includes(personId)) {
                  relatedPersonIds.push(personId);
                  
                  // Update the event document with the person ID
                  await eventRef.update({
                    relatedPersonIds: relatedPersonIds,
                    updatedAt: Timestamp.fromDate(new Date()),
                  });
                  
                  console.log(`[LINK] ✓ SUCCESS: Linked person ${personId} to event ${personEventId}. Event now has ${relatedPersonIds.length} people.`);
                } else {
                  console.log(`[LINK] Person ${personId} already linked to event ${personEventId}`);
                }
              }
            } catch (error: any) {
              console.error(`[LINK] ERROR linking person ${personId} to event ${personEventId}:`, error);
              console.error('[LINK] Error message:', error.message);
              console.error('[LINK] Error stack:', error.stack);
              // Continue - don't fail the whole request, but log it for debugging
            }
          } else {
            console.log(`[LINK] Skipping event link - personEventId: ${personEventId || 'null'}, personId: ${personId || 'null'}`);
          }
        }
      } catch (error: any) {
        console.error('Failed to create People & Partners entry:', error);
        // Don't fail the whole request if people creation fails
      }
    }

    // For volunteer types, also save to volunteers collection
    if (type === 'volunteer') {
      try {
        const volunteerData = {
          name,
          email,
          phone: phone || undefined,
          organization: organization || undefined,
          supportTypes: formDataObj.supportTypes ? (Array.isArray(formDataObj.supportTypes) ? formDataObj.supportTypes : [formDataObj.supportTypes]) : undefined,
          availability: formDataObj.availability || undefined,
          skills: formDataObj.skills || undefined,
          workWithYouth: formDataObj.workWithYouth || undefined,
          transportation: formDataObj.transportation || undefined,
        };
        await createVolunteer(volunteerData);
        console.log('Successfully created Volunteer entry');
      } catch (error: any) {
        console.error('Failed to create Volunteer entry:', error);
      }
    }

    return NextResponse.json(
      { message: 'Thank you! Your submission has been received.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get Involved form submission error:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
