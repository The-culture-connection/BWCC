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
          await createPerson(personData);
          console.log('Successfully created People & Partners entry');
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
