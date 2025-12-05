import { NextRequest, NextResponse } from 'next/server';

// Helper function to format date/time in EST timezone
// Assumes the input time is already in EST/EDT (Eastern Time)
function formatAsEST(dateStr: string, timeStr: string): string {
  try {
    // Ensure time has seconds
    const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2
      ? `${timeStr}:00`
      : timeStr;
    
    // Create date object treating the input as Eastern Time
    // Format: YYYY-MM-DDTHH:mm:ss-05:00 (EST) or -04:00 (EDT)
    const date = new Date(`${dateStr}T${timeWithSeconds}`);
    
    // Determine if EST (Nov-Mar) or EDT (Mar-Nov) - EST is UTC-5, EDT is UTC-4
    // For simplicity, we'll use America/New_York timezone which handles DST automatically
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    
    // Calculate offset (EDT is UTC-4, EST is UTC-5)
    const offsetMs = estDate.getTime() - utcDate.getTime();
    const offsetHours = offsetMs / (1000 * 60 * 60);
    const offsetStr = offsetHours === -4 ? '-04:00' : '-05:00'; // EDT or EST
    
    // Format the date string with timezone
    const year = dateStr.split('-')[0];
    const month = dateStr.split('-')[1];
    const day = dateStr.split('-')[2];
    
    return `${year}-${month}-${day}T${timeWithSeconds}${offsetStr}`;
  } catch (error) {
    console.error('Error formatting as EST:', error);
    // Fallback: add EST timezone indicator (assume EST, UTC-5)
    const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2
      ? `${timeStr}:00`
      : timeStr;
    return `${dateStr}T${timeWithSeconds}-05:00`;
  }
}

// Map form types to Notion Request Type values (must match database select options exactly)
const requestTypeMap: Record<string, string> = {
  'speak': 'Speaking',
  'partner': 'Partnership',
  'listening': 'Listening Session',
  'panel-topic': 'Panel Idea',
  'panelist': 'Panelist Application',
  'volunteer': 'Volunteer',
  'training': 'Training',
  'podcast': 'Podcast Guest',
  'share': 'Partnership', // Using Partnership for shared opportunities
};

// Map form types to Event Type values for Events & Activities database
const eventTypeMap: Record<string, string> = {
  'speak': 'Speaking',
  'listening': 'Listening Session',
  'training': 'Training',
  'partner': 'Partnership Event',
};

// Helper function to create a Notion page
async function createNotionPage(
  databaseId: string,
  properties: Record<string, any>,
  notionApiKey: string
): Promise<{ id: string }> {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: {
        database_id: databaseId,
      },
      properties,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Notion API error: ${errorData.message || 'Unknown error'}`);
  }

  return response.json();
}

// Generate Request Title
function generateRequestTitle(type: string, name: string, organization?: string): string {
  const typeName = requestTypeMap[type] || type;
  const orgName = organization || name;
  return `${typeName} Request – ${orgName}`;
}

// Build Details field from form data based on type
function buildDetails(type: string, formData: Record<string, any>): string {
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
      if (formData.partnershipType) details.push(`Partnership Type: ${formData.partnershipType}`);
      if (formData.problem) details.push(`Problem/Need: ${formData.problem}`);
      if (formData.outcomes) details.push(`Desired Outcomes: ${formData.outcomes}`);
      if (formData.additionalNotes) details.push(`Additional Information: ${formData.additionalNotes}`);
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

    case 'podcast':
      if (formData.why) details.push(`Reason: ${formData.why}`);
      if (formData.topic) details.push(`Topic/Story: ${formData.topic}`);
      if (formData.pastInterviews) details.push(`Past Interviews: ${formData.pastInterviews}`);
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
function buildPreferredDates(formData: Record<string, any>): string {
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
function generateEventTitle(type: string, name: string, organization?: string, formData?: Record<string, any>): string {
  const eventType = eventTypeMap[type] || type;
  const orgName = organization || name;
  
  // Add specific details based on type
  if (type === 'listening' && formData?.goal) {
    return `${eventType} – ${orgName}`;
  }
  if (type === 'training' && formData?.trainingType) {
    return `${formData.trainingType} Training – ${orgName}`;
  }
  if (type === 'partner' && formData?.partnershipType) {
    return `${formData.partnershipType} – ${orgName}`;
  }
  
  return `${eventType} – ${orgName}`;
}

// Build event description/summary
function buildEventDescription(type: string, formData: Record<string, any>): string {
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
      if (formData.partnershipType) description.push(`Partnership Type: ${formData.partnershipType}`);
      if (formData.problem) description.push(`Problem/Need: ${formData.problem}`);
      if (formData.outcomes) description.push(`Desired Outcomes: ${formData.outcomes}`);
      break;
  }

  return description.join('\n\n');
}

// Build event properties for Events & Activities database
function buildEventProperties(
  type: string,
  formData: Record<string, any>,
  name: string,
  organization: string,
  requestPageId: string | null,
  moreInfoLink: string = ''
): Record<string, any> {
  const eventType = eventTypeMap[type];
  if (!eventType) return {};

  const properties: Record<string, any> = {
    'Event Title': {
      title: [
        {
          text: {
            content: generateEventTitle(type, name, organization, formData),
          },
        },
      ],
    },
    'Event Type': {
      select: {
        name: eventType,
      },
    },
    'Status': {
      select: {
        name: 'Requested',
      },
    },
    'Public Event?': {
      checkbox: type === 'speak' && (formData.isPublicEvent === true || formData.isPublicEvent === 'true') ? true : false,
    },
    'Marketing Status': {
      select: {
        name: 'Flyer Needed',
      },
    },
    'Related Request': {
      relation: requestPageId ? [
        {
          id: requestPageId,
        },
      ] : [],
    },
  };

  // Add Date (Date field)
  if (formData.preferredDate) {
    try {
      // Ensure date is in YYYY-MM-DD format
      const dateStr = formData.preferredDate.split('T')[0]; // Remove time if present
      properties['Date'] = {
        date: {
          start: dateStr,
        },
      };
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  }

  // Add Start Time (Date/Time field) - converted to EST
  if (formData.preferredDate && formData.preferredStartTime) {
    try {
      const dateStr = formData.preferredDate.split('T')[0];
      // Time input returns HH:mm, need to add seconds
      const timeParts = formData.preferredStartTime.split(':');
      const timeStr = timeParts.length === 2 
        ? `${formData.preferredStartTime}:00` // Add seconds
        : formData.preferredStartTime; // Already has seconds or format
      
      // Format as EST
      const startDateTimeEST = formatAsEST(dateStr, timeStr);
      
      properties['Start Time'] = {
        date: {
          start: startDateTimeEST,
        },
      };
    } catch (error) {
      console.error('Error parsing start time:', error);
    }
  }

  // Add End Time (Date/Time field) - converted to EST
  if (formData.preferredDate && formData.preferredEndTime) {
    try {
      const dateStr = formData.preferredDate.split('T')[0];
      // Time input returns HH:mm, need to add seconds
      const timeParts = formData.preferredEndTime.split(':');
      const timeStr = timeParts.length === 2 
        ? `${formData.preferredEndTime}:00` // Add seconds
        : formData.preferredEndTime; // Already has seconds or format
      
      // Format as EST
      const endDateTimeEST = formatAsEST(dateStr, timeStr);
      
      properties['End Time'] = {
        date: {
          start: endDateTimeEST,
        },
      };
    } catch (error) {
      console.error('Error parsing end time:', error);
    }
  }

  // Add Location
  let location = formData.location || '';
  if (type === 'listening' && formData.locationSupport === 'I need location support') {
    location = 'Location support needed';
  }
  // For speaking, ensure location is included
  if (type === 'speak' && !location) {
    location = formData.location || '';
  }
  if (location) {
    properties['Location'] = {
      rich_text: [
        {
          text: {
            content: location,
          },
        },
      ],
    };
  }

  // Add Purpose - map from purpose-related fields in each questionnaire
  let purpose = '';
  switch (type) {
    case 'speak':
      purpose = formData.purpose || '';
      break;
    case 'partner':
      purpose = formData.problem || ''; // "What need/problem are you trying to solve?"
      break;
    case 'listening':
      purpose = formData.goal || ''; // "What is your goal for this listening session?"
      break;
    case 'panel-topic':
      purpose = formData.importance || ''; // "Why is this topic important right now?"
      break;
    case 'podcast':
      purpose = formData.why || ''; // "Why do you want to be on the podcast?"
      break;
    case 'share':
      purpose = formData.why || ''; // "Why should our community know about it?"
      break;
    case 'training':
      // Training might have hopes/learning goals
      purpose = formData.hopes || '';
      break;
  }

  if (purpose) {
    properties['Purpose'] = {
      rich_text: [
        {
          text: {
            content: purpose,
          },
        },
      ],
    };
  }

  // Add Audience Type and Audience Number
  // For speaking engagements
  if (type === 'speak') {
    if (formData.audience) {
      properties['Audience Type'] = {
        rich_text: [
          {
            text: {
              content: formData.audience,
            },
          },
        ],
      };
    }
    if (formData.attendees) {
      const attendeeCount = typeof formData.attendees === 'number' 
        ? formData.attendees 
        : parseInt(formData.attendees, 10);
      if (!isNaN(attendeeCount)) {
        properties['Audience Number'] = {
          number: attendeeCount,
        };
      }
    }
  }
  
  // For listening sessions (participants/demographic)
  if (type === 'listening') {
    if (formData.demographic) {
      properties['Audience Type'] = {
        rich_text: [
          {
            text: {
              content: formData.demographic,
            },
          },
        ],
      };
    }
    if (formData.participants) {
      const participantCount = typeof formData.participants === 'number' 
        ? formData.participants 
        : parseInt(formData.participants, 10);
      if (!isNaN(participantCount)) {
        properties['Audience Number'] = {
          number: participantCount,
        };
      }
    }
  }
  
  // For share opportunities
  if (type === 'share' && formData.audience) {
    properties['Audience Type'] = {
      rich_text: [
        {
          text: {
            content: formData.audience,
          },
        },
      ],
    };
  }

  // Add Description / Summary
  const description = buildEventDescription(type, formData);
  if (description) {
    properties['Description / Summary'] = {
      rich_text: [
        {
          text: {
            content: description,
          },
        },
      ],
    };
  }

  // Add Goals / Metrics (for Listening Sessions)
  if (type === 'listening') {
    const goalsMetrics: string[] = [];
    if (formData.goal) goalsMetrics.push(`Goal: ${formData.goal}`);
    if (formData.metric) goalsMetrics.push(`Metric: ${formData.metric}`);
    if (goalsMetrics.length > 0) {
      properties['Goals / Metrics'] = {
        rich_text: [
          {
            text: {
              content: goalsMetrics.join('\n'),
            },
          },
        ],
      };
    }
  }

  // Add Participant Criteria (for Listening Sessions)
  if (type === 'listening' && formData.demographic) {
    properties['Participant Criteria'] = {
      rich_text: [
        {
          text: {
            content: formData.demographic,
          },
        },
      ],
    };
  }

  // Add Compensation Offered
  const compensation = formData.budget || formData.compensation || formData.resources || '';
  if (compensation) {
    properties['Compensation Offered'] = {
      rich_text: [
        {
          text: {
            content: compensation,
          },
        },
      ],
    };
  }

  // Add Documents / Files to Events database (if link provided)
  if (moreInfoLink) {
    properties['Documents / Files'] = {
      files: [
        {
          name: 'More Information PDF',
          external: {
            url: moreInfoLink,
          },
        },
      ],
    };
  }

  // Add empty fields
  properties['What We Did'] = { rich_text: [] };
  properties['What We Need Next'] = { rich_text: [] };
  properties['Zapier ID'] = { rich_text: [] };

  return properties;
}

// Build People & Partners properties
function buildPeopleProperties(
  type: string,
  formData: Record<string, any>,
  name: string,
  organization: string,
  email: string,
  phone: string,
  eventPageId: string | null = null,
  moreInfoLink: string = ''
): Record<string, any> | null {
  // Map form types to People Role values
  const roleMap: Record<string, string> = {
    'partner': 'Partner',
    'panelist': 'Panelist',
    'volunteer': 'Volunteer',
    'podcast': 'Podcast Guest',
  };

  const role = roleMap[type];
  if (!role) return null; // Not a type that creates People entry

  const properties: Record<string, any> = {
    'Name': {
      title: [
        {
          text: {
            content: name,
          },
        },
      ],
    },
    'Role': {
      select: {
        name: role,
      },
    },
  };

  // Email
  if (email) {
    properties['Email'] = {
      email: email,
    };
  }

  // Phone
  if (phone) {
    properties['Phone'] = {
      phone_number: phone,
    };
  }

  // Organization
  if (organization) {
    properties['Organization'] = {
      rich_text: [
        {
          text: {
            content: organization,
          },
        },
      ],
    };
  }

  // Expertise Areas (multi-select)
  const expertiseAreas: string[] = [];
  
  switch (type) {
    case 'partner':
      // For partners, use partnership type as expertise
      if (formData.partnershipType) {
        expertiseAreas.push(formData.partnershipType);
      }
      break;
      
    case 'panelist':
      // Parse expertise from textarea
      if (formData.expertise) {
        const parsed = formData.expertise
          .split(/[,\n;]/)
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
        expertiseAreas.push(...parsed);
      }
      // Also add topics
      if (formData.topics) {
        const parsed = formData.topics
          .split(/[,\n;]/)
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);
        expertiseAreas.push(...parsed);
      }
      break;
      
    case 'volunteer':
      // Use support types as expertise
      if (formData.supportTypes) {
        const types = Array.isArray(formData.supportTypes) 
          ? formData.supportTypes 
          : [formData.supportTypes];
        expertiseAreas.push(...types);
      }
      break;
      
    case 'podcast':
      // Use topic/story as expertise
      if (formData.topic) {
        const parsed = formData.topic
          .split(/[,\n;]/)
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);
        expertiseAreas.push(...parsed);
      }
      break;
  }

  // Remove duplicates
  const uniqueAreas = [...new Set(expertiseAreas)];
  if (uniqueAreas.length > 0) {
    properties['Expertise Areas'] = {
      multi_select: uniqueAreas.map((area: string) => ({ name: area })),
    };
  }

  // Bio
  let bio = '';
  switch (type) {
    case 'partner':
      // Combine problem and outcomes as bio
      const partnerBio: string[] = [];
      if (formData.problem) partnerBio.push(`Need/Problem: ${formData.problem}`);
      if (formData.outcomes) partnerBio.push(`Desired Outcomes: ${formData.outcomes}`);
      if (formData.additionalNotes) partnerBio.push(`Additional Notes: ${formData.additionalNotes}`);
      bio = partnerBio.join('\n\n');
      break;
      
    case 'panelist':
      bio = formData.bio || '';
      // Add experience if available
      if (formData.experience) {
        bio += `\n\nPrevious Experience: ${formData.experience}`;
      }
      break;
      
    case 'volunteer':
      // Build bio from skills and experience
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
      
    case 'podcast':
      // Use why and topic as bio
      const podcastBio: string[] = [];
      if (formData.why) podcastBio.push(`Why: ${formData.why}`);
      if (formData.topic) podcastBio.push(`Topic/Story: ${formData.topic}`);
      if (formData.pastInterviews) {
        podcastBio.push(`Past Interviews: ${formData.pastInterviews}`);
      }
      bio = podcastBio.join('\n\n');
      break;
  }

  if (bio) {
    properties['Bio'] = {
      rich_text: [
        {
          text: {
            content: bio,
          },
        },
      ],
    };
  }

  // Headshot (Files) - use moreInfoLink if provided
  if (moreInfoLink && (type === 'panelist' || type === 'podcast')) {
    properties['Headshot'] = {
      files: [
        {
          name: 'Headshot or Bio',
          external: {
            url: moreInfoLink,
          },
        },
      ],
    };
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

  if (availability) {
    properties['Availability Notes'] = {
      rich_text: [
        {
          text: {
            content: availability,
          },
        },
      ],
    };
  }

  // Related Events (if event was created)
  if (eventPageId) {
    properties['Related Events'] = {
      relation: [
        {
          id: eventPageId,
        },
      ],
    };
  }

  // Related Tasks - empty initially
  properties['Related Tasks'] = {
    relation: [],
  };

  return properties;
}

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

    // Notion API configuration
    const notionApiKey = process.env.NOTION_API_KEY;
    const requestsDatabaseId = process.env.NOTION_REQUESTS_DATABASE_ID || process.env.NOTION_DATABASE_ID;
    const eventsDatabaseId = process.env.NOTION_EVENTS_DATABASE_ID;
    const peopleDatabaseId = process.env.NOTION_PEOPLE_DATABASE_ID;

    if (!notionApiKey || !requestsDatabaseId) {
      console.error('Notion API credentials not configured', {
        hasApiKey: !!notionApiKey,
        hasDatabaseId: !!requestsDatabaseId,
      });
      return NextResponse.json(
        { error: 'Server configuration error. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Extract standard fields - DIRECT MAPPING to database fields
    const name = formDataObj.name || '';
    const organization = formDataObj.organization || '';
    const email = formDataObj.email || '';
    const phone = formDataObj.phone || '';

    // Generate Request Title
    const requestTitle = generateRequestTitle(type, name, organization);

    // Build Details field
    let details = buildDetails(type, formDataObj);

    // Extract Budget / Compensation
    const budget = formDataObj.budget || formDataObj.compensation || formDataObj.resources || '';

    // Build Preferred Dates
    const preferredDates = buildPreferredDates(formDataObj);

    // Handle more information PDF link
    const moreInfoLink = formDataObj.moreInfoLink || '';

    // Build Notion properties - DIRECT MAPPING to database schema
    const properties: Record<string, any> = {
      'Request Title': {
        title: [
          {
            text: {
              content: requestTitle,
            },
          },
        ],
      },
      'Request Type': {
        select: {
          name: requestTypeMap[type] || type,
        },
      },
      'Decision': {
        select: {
          name: 'Pending',
        },
      },
    };

    // Name (Text) - required
    if (name) {
      properties['Name'] = {
        rich_text: [
          {
            text: {
              content: name,
            },
          },
        ],
      };
    }

    // Organization (Text) - if relevant
    if (organization) {
      properties['Organization'] = {
        rich_text: [
          {
            text: {
              content: organization,
            },
          },
        ],
      };
    }

    // Email (Email) - required
    if (email) {
      properties['Email'] = {
        email: email,
      };
    }

    // Phone (Phone) - optional
    if (phone) {
      properties['Phone'] = {
        phone_number: phone,
      };
    }

    // Details (Text) - summary of their ask
    if (details) {
      properties['Details'] = {
        rich_text: [
          {
            text: {
              content: details,
            },
          },
        ],
      };
    }

    // Budget / Compensation (Text) - if applicable
    if (budget) {
      properties['Budget / Compensation'] = {
        rich_text: [
          {
            text: {
              content: budget,
            },
          },
        ],
      };
    }

    // Preferred Dates (Text) - used for scheduling
    if (preferredDates) {
      properties['Preferred Dates'] = {
        rich_text: [
          {
            text: {
              content: preferredDates,
            },
          },
        ],
      };
    }

    // Uploaded Files - Add link to More Information PDF if provided
    // Note: Notion Files property accepts external URLs
    if (moreInfoLink) {
      properties['Uploaded Files'] = {
        files: [
          {
            name: 'More Information PDF',
            external: {
              url: moreInfoLink,
            },
          },
        ],
      };
    }

    // Related Event (Relation) - empty initially, will be linked later
    // Not setting this as it requires a relation which should be empty initially

    // Internal Notes (Text) - empty initially, for team use
    properties['Internal Notes'] = {
      rich_text: [],
    };

    // Zapier ID (Text) - empty initially, internal use
    properties['Zapier ID'] = {
      rich_text: [],
    };

    // Types that should NOT create Request & Intake entries (only go to People & Partners)
    const skipRequestTypes = ['panelist', 'volunteer', 'podcast'];
    let requestPageId: string | null = null;

    // Only create Request & Intake entry for types that are NOT in skipRequestTypes
    if (!skipRequestTypes.includes(type)) {
      // Create page in Notion database
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: {
            database_id: requestsDatabaseId,
          },
          properties,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notion API error:', errorData);
        return NextResponse.json(
          { error: `Failed to submit form: ${errorData.message || 'Unknown error'}` },
          { status: response.status }
        );
      }

      const result = await response.json();
      requestPageId = result.id;
      console.log('Successfully created Request entry:', requestPageId);
    } else {
      console.log(`Skipping Request & Intake entry for type: ${type} (only creating People & Partners entry)`);
    }

    // Create Events & Activities entry for applicable types
    let eventPageId: string | null = null;
    const eventCreatingTypes = ['speak', 'listening', 'training', 'partner'];
    if (eventsDatabaseId && eventCreatingTypes.includes(type)) {
      try {
        const eventProperties = buildEventProperties(
          type,
          formDataObj,
          name,
          organization,
          requestPageId,
          moreInfoLink
        );

        const eventResult = await createNotionPage(eventsDatabaseId, eventProperties, notionApiKey);
        eventPageId = eventResult.id;
        console.log('Successfully created Event entry:', eventPageId);

        // Update the Request entry to link to the Event (only if Request entry exists)
        if (requestPageId) {
          await fetch(`https://api.notion.com/v1/pages/${requestPageId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28',
            },
            body: JSON.stringify({
              properties: {
                'Related Event': {
                  relation: [
                    {
                      id: eventPageId,
                    },
                  ],
                },
              },
            }),
          });
          console.log('Linked Request to Event');
        }
      } catch (error: any) {
        console.error('Failed to create Event entry:', error);
        // Don't fail the whole request if event creation fails
      }
    }

    // Create People & Partners entry for applicable types
    const peopleCreatingTypes = ['partner', 'panelist', 'volunteer', 'podcast'];
    if (peopleDatabaseId && peopleCreatingTypes.includes(type)) {
      try {
        const peopleProperties = buildPeopleProperties(
          type,
          formDataObj,
          name,
          organization,
          email,
          phone,
          eventPageId,
          moreInfoLink
        );

        if (peopleProperties) {
          const peopleResult = await createNotionPage(peopleDatabaseId, peopleProperties, notionApiKey);
          console.log('Successfully created People & Partners entry:', peopleResult.id);
        }
      } catch (error: any) {
        console.error('Failed to create People & Partners entry:', error);
        // Don't fail the whole request if people creation fails
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
