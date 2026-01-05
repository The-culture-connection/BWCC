// Database Types for BWCC Workspace

export type RequestType = 
  | 'speak' 
  | 'partner' 
  | 'listening' 
  | 'panel-topic' 
  | 'panelist' 
  | 'volunteer' 
  | 'training' 
  | 'podcast' 
  | 'share';

export type RequestStatus = 'Pending' | 'Approved' | 'Denied' | 'In Progress' | 'Completed';
export type Decision = 'Pending' | 'Approved' | 'Denied';

export interface Request {
  id?: string;
  requestTitle: string;
  requestType: RequestType;
  status: RequestStatus;
  decision: Decision;
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  details: string; // Summary of their ask
  budgetCompensation?: string;
  preferredDates?: string;
  uploadedFiles?: string[]; // URLs to files
  relatedEventId?: string;
  internalNotes?: string;
  zapierId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // User ID if created through admin
}

export type EventType = 'Speaking' | 'Listening Session' | 'Training' | 'Partnership Event' | 'Other';
export type EventStatus = 'Requested' | 'Pending' | 'Approved' | 'Cancelled' | 'Completed';
export type MarketingStatus = 'Flyer Needed' | 'In Progress' | 'Complete' | 'Not Needed';

export interface Event {
  id?: string;
  eventTitle: string;
  eventType: EventType;
  status: EventStatus;
  isPublicEvent: boolean;
  marketingStatus: MarketingStatus;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  purpose?: string;
  audienceType?: string;
  audienceNumber?: number;
  description?: string;
  goalsMetrics?: string; // For listening sessions
  participantCriteria?: string; // For listening sessions
  compensationOffered?: string;
  documents?: string[]; // URLs
  whatWeDid?: string;
  whatWeNeedNext?: string;
  zapierId?: string;
  relatedRequestId?: string;
  relatedCommitteeIds?: string[]; // Committee IDs (multiselect)
  relatedPersonIds?: string[]; // Person IDs (for panelists/volunteers/partners)
  content?: EventContent; // Collected content for the event
  googleCalendarEventId?: string; // Google Calendar event ID for private events
  createdAt: Date;
  updatedAt: Date;
}

export interface EventContent {
  photos?: string[]; // URLs
  videos?: string[]; // URLs
  documents?: string[]; // URLs
  notes?: string;
  attendance?: number;
  feedback?: string;
  followUp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PeopleRole = 'Partner' | 'Panelist' | 'Volunteer' | 'Podcast Guest' | 'Contact' | 'Board Member' | 'Staff';
export type PersonStatus = 'Pending' | 'Approved' | 'Denied';

export interface Person {
  id?: string;
  name: string;
  role: PeopleRole;
  status?: PersonStatus; // Approval status
  email?: string;
  phone?: string;
  organization?: string;
  expertiseAreas?: string[];
  bio?: string;
  headshot?: string; // URL
  availabilityNotes?: string;
  relatedEventIds?: string[];
  relatedTaskIds?: string[];
  metadata?: PersonMetadata;
  notes?: InteractionNote[];
  assignedEventId?: string; // Event this person is assigned to (for panelist/volunteer/podcast)
  sendConfirmationEmail?: boolean; // Flag to send confirmation email (implement later)
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonMetadata {
  firstContact?: Date;
  lastContact?: Date;
  contactFrequency?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface InteractionNote {
  id: string;
  date: Date;
  note: string;
  createdBy: string; // User ID
  type?: 'call' | 'email' | 'meeting' | 'event' | 'other';
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: string; // User ID
  assignedToCommittee?: string; // Committee ID
  dueDate?: Date;
  relatedEventId?: string;
  relatedPersonId?: string;
  relatedRequestId?: string;
  deliverables?: string[]; // URLs to uploaded files
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  completedAt?: Date;
}

export interface Committee {
  id?: string;
  name: string;
  description?: string;
  members?: string[]; // User IDs
  relatedTaskIds?: string[];
  relatedMeetingIds?: string[];
  relatedPersonIds?: string[];
  relatedEventIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Meeting {
  id?: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  attendees?: string[]; // User IDs
  committeeId?: string;
  minutes?: string; // Meeting minutes content
  googleCalendarEventId?: string; // Google Calendar event ID
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Suggestion {
  id?: string;
  description: string;
  category?: string;
  status?: 'New' | 'In Review' | 'Approved' | 'Rejected';
  createdBy?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  type: 'meeting' | 'event' | 'task' | 'other';
  isPrivate: boolean;
  relatedEventId?: string;
  relatedTaskId?: string;
  attendees?: string[]; // User IDs or email addresses
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface NewsletterSignup {
  id?: string;
  name: string;
  email: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
}

export interface Volunteer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  supportTypes?: string[];
  availability?: string;
  skills?: string;
  workWithYouth?: string;
  transportation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'board' | 'staff';
  subscribedToPrivateCalendar?: boolean; // If true, user will receive invites for private calendar events
  createdAt: Date;
  lastLogin?: Date;
}

