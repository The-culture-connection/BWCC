// Helper functions for building request data (converted from Notion mapping)

import { Request, Event, Person, RequestType } from '../types/database';

// Map form types to Request Type values
const requestTypeMap: Record<string, RequestType> = {
  'speak': 'speak',
  'partner': 'partner',
  'listening': 'listening',
  'panel-topic': 'panel-topic',
  'panelist': 'panelist',
  'volunteer': 'volunteer',
  'training': 'training',
  'share': 'share',
};

// Map form types to Event Type values
const eventTypeMap: Record<string, 'Speaking' | 'Listening Session' | 'Training' | 'Partnership Event'> = {
  'speak': 'Speaking',
  'listening': 'Listening Session',
  'training': 'Training',
  'partner': 'Partnership Event',
};

// Generate Request Title
export function generateRequestTitle(type: string, name: string, organization?: string): string {
  const typeNames: Record<string, string> = {
    'speak': 'Speaking',
    'partner': 'Partnership',
    'listening': 'Listening Session',
    'panel-topic': 'Panel Idea',
    'panelist': 'Panelist Application',
    'volunteer': 'Volunteer',
    'training': 'Training',
    'share': 'Partnership',
  };
  const typeName = typeNames[type] || type;
  const orgName = organization || name;
  return `${typeName} Request – ${orgName}`;
}

// Build Details field from form data based on type
export function buildDetails(type: string, formData: Record<string, any>): string {
  const details: string[] = [];

  switch (type) {
    case 'speak':
      if (formData.engagementType) details.push(`Engagement Type: ${formData.engagementType}`);
      if (formData.audience) details.push(`Audience: ${formData.audience}`);
      if (formData.topics) {
        const topics = Array.isArray(formData.topics) ? formData.topics.join(', ') : formData.topics;
        details.push(`Topics: ${topics}`);
        if (formData.otherTopic && formData.topics.includes('Other')) {
          details.push(`Other Topic: ${formData.otherTopic}`);
        }
      }
      if (formData.purpose) details.push(`Purpose: ${formData.purpose}`);
      if (formData.attendees) details.push(`Expected Attendees: ${formData.attendees}`);
      if (formData.location) details.push(`Location: ${formData.location}`);
      if (formData.additionalNotes) details.push(`Additional Notes: ${formData.additionalNotes}`);
      break;

    case 'partner':
      if (formData.partnershipRequest) details.push(`Partnership Request: ${formData.partnershipRequest}`);
      break;

    case 'listening':
      if (formData.goal) details.push(`Goal: ${formData.goal}`);
      if (formData.metric) details.push(`Metric to Measure: ${formData.metric}`);
      if (formData.analysis) details.push(`Desired Analysis: ${formData.analysis}`);
      if (formData.demographic) details.push(`Target Demographic: ${formData.demographic}`);
      if (formData.participants) details.push(`Participants Needed: ${formData.participants}`);
      if (formData.locationSupport) {
        details.push(`Location: ${formData.locationSupport}`);
        if (formData.location && formData.locationSupport === 'I have a location') {
          details.push(`Location Details: ${formData.location}`);
        }
      }
      break;

    case 'panel-topic':
      if (formData.topic) details.push(`Topic: ${formData.topic}`);
      if (formData.importance) details.push(`Why Important: ${formData.importance}`);
      if (formData.suggestedPanelists) details.push(`Suggested Panelists: ${formData.suggestedPanelists}`);
      if (formData.keyQuestions) details.push(`Key Questions: ${formData.keyQuestions}`);
      if (formData.interested) details.push(`Interested in Attending: ${formData.interested}`);
      break;

    case 'panelist':
      if (formData.bio) details.push(`Bio: ${formData.bio}`);
      if (formData.expertise) details.push(`Expertise: ${formData.expertise}`);
      if (formData.topics) details.push(`Topics: ${formData.topics}`);
      if (formData.experience) details.push(`Experience: ${formData.experience}`);
      if (formData.availability) details.push(`Availability: ${formData.availability}`);
      break;

    case 'volunteer':
      if (formData.supportTypes) {
        const types = Array.isArray(formData.supportTypes) ? formData.supportTypes.join(', ') : formData.supportTypes;
        details.push(`Support Types: ${types}`);
      }
      if (formData.availability) details.push(`Availability: ${formData.availability}`);
      if (formData.skills) details.push(`Skills: ${formData.skills}`);
      if (formData.workWithYouth) details.push(`Comfortable with Youth: ${formData.workWithYouth}`);
      if (formData.transportation) details.push(`Transportation: ${formData.transportation}`);
      break;

    case 'training':
      if (formData.trainingType) details.push(`Training Type: ${formData.trainingType}`);
      if (formData.hopes) details.push(`Learning Goals: ${formData.hopes}`);
      if (formData.certification) details.push(`Seeking Certification: ${formData.certification}`);
      break;

    case 'share':
      if (formData.type) details.push(`Opportunity Type: ${formData.type}`);
      if (formData.audience) details.push(`Target Audience: ${formData.audience}`);
      if (formData.why) details.push(`Why Share: ${formData.why}`);
      if (formData.link) details.push(`Link: ${formData.link}`);
      break;
  }

  return details.join('\n\n');
}

// Build Preferred Dates string
export function buildPreferredDates(formData: Record<string, any>): string {
  const dates: string[] = [];
  
  if (formData.preferredDate) {
    dates.push(`Date: ${formData.preferredDate}`);
  }
  
  if (formData.preferredStartTime) {
    dates.push(`Start Time: ${formData.preferredStartTime}`);
  }
  
  if (formData.preferredEndTime) {
    dates.push(`End Time: ${formData.preferredEndTime}`);
  }
  
  // Fallback to other date fields
  if (dates.length === 0) {
    if (formData.preferredDates) dates.push(formData.preferredDates);
    if (formData.preferredDateTime) dates.push(formData.preferredDateTime);
    if (formData.preferredTimes) dates.push(formData.preferredTimes);
    if (formData.timeline) dates.push(formData.timeline);
    if (formData.deadline) dates.push(`Deadline: ${formData.deadline}`);
  }
  
  return dates.join(', ') || '';
}

// Build event title
export function generateEventTitle(type: string, name: string, organization?: string, formData?: Record<string, any>): string {
  const eventType = eventTypeMap[type] || type;
  const orgName = organization || name;
  
  if (type === 'listening' && formData?.goal) {
    return `${eventType} – ${orgName}`;
  }
  if (type === 'training' && formData?.trainingType) {
    return `${formData.trainingType} Training – ${orgName}`;
  }
  if (type === 'partner' && formData?.engagementType) {
    return `${eventType} – ${orgName}`;
  }
  
  return `${eventType} – ${orgName}`;
}

// Build event description/summary
export function buildEventDescription(type: string, formData: Record<string, any>): string {
  const description: string[] = [];

  switch (type) {
    case 'speak':
      if (formData.engagementType) description.push(`Type: ${formData.engagementType}`);
      if (formData.audience) description.push(`Audience: ${formData.audience}`);
      if (formData.topics) {
        const topics = Array.isArray(formData.topics) ? formData.topics.join(', ') : formData.topics;
        description.push(`Topics: ${topics}`);
      }
      if (formData.purpose) description.push(`Purpose: ${formData.purpose}`);
      if (formData.attendees) description.push(`Expected Attendees: ${formData.attendees}`);
      break;

    case 'listening':
      if (formData.goal) description.push(`Goal: ${formData.goal}`);
      if (formData.analysis) description.push(`Desired Analysis: ${formData.analysis}`);
      if (formData.participants) description.push(`Participants Needed: ${formData.participants}`);
      break;

    case 'training':
      if (formData.trainingType) description.push(`Training Type: ${formData.trainingType}`);
      if (formData.hopes) description.push(`Learning Goals: ${formData.hopes}`);
      if (formData.certification) description.push(`Certification: ${formData.certification}`);
      break;

    case 'partner':
      if (formData.partnershipRequest) description.push(formData.partnershipRequest);
      break;
  }

  return description.join('\n\n');
}

// Helper to format date/time in EST timezone (for compatibility)
export function formatAsEST(dateStr: string, timeStr: string): Date {
  try {
    const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2
      ? `${timeStr}:00`
      : timeStr;
    
    const date = new Date(`${dateStr}T${timeWithSeconds}`);
    return date;
  } catch (error) {
    console.error('Error formatting as EST:', error);
    return new Date(`${dateStr}T00:00:00`);
  }
}

// Build Request object from form data
export function buildRequest(
  type: string,
  formData: Record<string, any>,
  name: string,
  organization: string,
  email: string,
  phone: string,
  moreInfoLink: string
): Omit<Request, 'id' | 'createdAt' | 'updatedAt'> {
  const requestTitle = generateRequestTitle(type, name, organization);
  const details = buildDetails(type, formData);
  const preferredDates = buildPreferredDates(formData);
  const budget = formData.budget || formData.compensation || formData.resources || '';

  return {
    requestTitle,
    requestType: requestTypeMap[type] || type as RequestType,
    status: 'Pending',
    decision: 'Pending',
    name,
    organization: organization || undefined,
    email,
    phone: phone || undefined,
    details,
    budgetCompensation: budget || undefined,
    preferredDates: preferredDates || undefined,
    uploadedFiles: moreInfoLink ? [moreInfoLink] : undefined,
    internalNotes: '',
    zapierId: '',
  };
}

// Build Event object from form data
export function buildEvent(
  type: string,
  formData: Record<string, any>,
  name: string,
  organization: string,
  requestId: string | null,
  moreInfoLink: string
): Omit<Event, 'id' | 'createdAt' | 'updatedAt'> | null {
  const eventType = eventTypeMap[type];
  if (!eventType) return null;

  const event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
    eventTitle: generateEventTitle(type, name, organization, formData),
    eventType,
    status: ['volunteer', 'panelist', 'partner'].includes(type) ? 'Pending' : 'Requested',
    isPublicEvent: type === 'speak' && (formData.isPublicEvent === true || formData.isPublicEvent === 'true'),
    marketingStatus: 'Flyer Needed',
    relatedRequestId: requestId || undefined,
    description: buildEventDescription(type, formData) || undefined,
  };

  // Add Date
  if (formData.preferredDate) {
    try {
      const dateStr = formData.preferredDate.split('T')[0];
      event.date = new Date(dateStr);
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  }

  // Add Start Time
  if (formData.preferredDate && formData.preferredStartTime) {
    try {
      const dateStr = formData.preferredDate.split('T')[0];
      event.startTime = formatAsEST(dateStr, formData.preferredStartTime);
    } catch (error) {
      console.error('Error parsing start time:', error);
    }
  }

  // Add End Time
  if (formData.preferredDate && formData.preferredEndTime) {
    try {
      const dateStr = formData.preferredDate.split('T')[0];
      event.endTime = formatAsEST(dateStr, formData.preferredEndTime);
    } catch (error) {
      console.error('Error parsing end time:', error);
    }
  }

  // Add Location
  let location = formData.location || '';
  if (type === 'listening' && formData.locationSupport === 'I need location support') {
    location = 'Location support needed';
  }
  if (location) {
    event.location = location;
  }

  // Add Purpose
  let purpose = '';
  switch (type) {
    case 'speak':
      purpose = formData.purpose || '';
      break;
    case 'partner':
      purpose = formData.partnershipRequest || '';
      break;
    case 'listening':
      purpose = formData.goal || '';
      break;
    case 'panel-topic':
      purpose = formData.importance || '';
      break;
    case 'share':
      purpose = formData.why || '';
      break;
    case 'training':
      purpose = formData.hopes || '';
      break;
  }
  if (purpose) event.purpose = purpose;

  // Add Audience Type and Audience Number
  if (type === 'speak' || type === 'partner') {
    if (formData.audience) event.audienceType = formData.audience;
    if (formData.attendees) {
      const attendeeCount = typeof formData.attendees === 'number' 
        ? formData.attendees 
        : parseInt(formData.attendees, 10);
      if (!isNaN(attendeeCount)) event.audienceNumber = attendeeCount;
    }
  }
  
  if (type === 'listening') {
    if (formData.demographic) event.audienceType = formData.demographic;
    if (formData.participants) {
      const participantCount = typeof formData.participants === 'number' 
        ? formData.participants 
        : parseInt(formData.participants, 10);
      if (!isNaN(participantCount)) event.audienceNumber = participantCount;
    }
  }
  
  if (type === 'share' && formData.audience) {
    event.audienceType = formData.audience;
  }

  // Add Goals / Metrics (for Listening Sessions)
  if (type === 'listening') {
    const goalsMetrics: string[] = [];
    if (formData.goal) goalsMetrics.push(`Goal: ${formData.goal}`);
    if (formData.metric) goalsMetrics.push(`Metric: ${formData.metric}`);
    if (goalsMetrics.length > 0) {
      event.goalsMetrics = goalsMetrics.join('\n');
    }
  }

  // Add Participant Criteria (for Listening Sessions)
  if (type === 'listening' && formData.demographic) {
    event.participantCriteria = formData.demographic;
  }

  // Add Compensation Offered
  const compensation = formData.budget || formData.compensation || formData.resources || '';
  if (compensation) {
    event.compensationOffered = compensation;
  }

  // Add Documents / Files
  if (moreInfoLink) {
    event.documents = [moreInfoLink];
  }

  event.whatWeDid = '';
  event.whatWeNeedNext = '';
  event.zapierId = '';

  return event;
}

// Build People object from form data
export function buildPerson(
  type: string,
  formData: Record<string, any>,
  name: string,
  organization: string,
  email: string,
  phone: string,
  eventId: string | null,
  moreInfoLink: string,
  assignedEventId?: string | null
): Omit<Person, 'id' | 'createdAt' | 'updatedAt'> | null {
  const roleMap: Record<string, 'Partner' | 'Panelist' | 'Volunteer'> = {
    'partner': 'Partner',
    'panelist': 'Panelist',
    'volunteer': 'Volunteer',
  };

  const role = roleMap[type];
  if (!role) return null;

  const finalEventId = assignedEventId || eventId;
  const person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
    name,
    role,
    status: 'Pending', // Default status for new submissions
    email: email || undefined,
    phone: phone || undefined,
    organization: organization || undefined,
    relatedEventIds: finalEventId ? [finalEventId] : undefined,
    relatedTaskIds: [],
    assignedEventId: assignedEventId || undefined,
  };

  // Expertise Areas
  const expertiseAreas: string[] = [];
  
  switch (type) {
    case 'partner':
      // No expertise areas for partner form
      break;
      
    case 'panelist':
      if (formData.expertise) {
        const parsed = formData.expertise
          .split(/[,\n;]/)
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
        expertiseAreas.push(...parsed);
      }
      if (formData.topics) {
        const parsed = formData.topics
          .split(/[,\n;]/)
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);
        expertiseAreas.push(...parsed);
      }
      break;
      
    case 'volunteer':
      if (formData.supportTypes) {
        const types = Array.isArray(formData.supportTypes) 
          ? formData.supportTypes 
          : [formData.supportTypes];
        // Ensure all items are strings, not objects
        const stringTypes = types.map((t: any) => {
          if (typeof t === 'string') return t;
          if (typeof t === 'object' && t !== null) {
            // If it's an object, try to extract a value property or stringify
            return t.value || t.label || t.name || JSON.stringify(t);
          }
          return String(t);
        }).filter((t: string) => t && t.length > 0);
        expertiseAreas.push(...stringTypes);
      }
      break;
  }

  const uniqueAreas = [...new Set(expertiseAreas)];
  if (uniqueAreas.length > 0) {
    person.expertiseAreas = uniqueAreas;
  }

  // Bio
  let bio = '';
  switch (type) {
    case 'partner':
      if (formData.partnershipRequest) {
        bio = formData.partnershipRequest;
      }
      break;
      
    case 'panelist':
      bio = formData.bio || '';
      if (formData.experience) {
        bio += `\n\nPrevious Experience: ${formData.experience}`;
      }
      break;
      
    case 'volunteer':
      const volunteerBio: string[] = [];
      if (formData.skills) volunteerBio.push(`Skills: ${formData.skills}`);
      if (formData.workWithYouth) {
        volunteerBio.push(`Comfortable with Youth: ${formData.workWithYouth}`);
      }
      if (formData.transportation) {
        volunteerBio.push(`Transportation: ${formData.transportation}`);
      }
      bio = volunteerBio.join('\n\n');
      break;
  }

  if (bio) person.bio = bio;

  // Headshot (use moreInfoLink if provided)
  if (moreInfoLink && type === 'panelist') {
    person.headshot = moreInfoLink;
  }

  // Availability Notes
  let availability = '';
  switch (type) {
    case 'panelist':
      availability = formData.availability || '';
      break;
      
    case 'volunteer':
      const volunteerAvailability: string[] = [];
      if (formData.availability) {
        volunteerAvailability.push(`Availability: ${formData.availability}`);
      }
      if (formData.transportation) {
        volunteerAvailability.push(`Transportation: ${formData.transportation}`);
      }
      availability = volunteerAvailability.join('\n');
      break;
  }

  if (availability) person.availabilityNotes = availability;

  return person;
}

