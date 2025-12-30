// Database utility functions for Firestore operations

import { adminDb } from './admin';
import { 
  Request, 
  Event, 
  Person, 
  Task, 
  Schedule, 
  NewsletterSignup, 
  Volunteer,
  RequestType,
  Decision
} from '../types/database';
import { Timestamp } from 'firebase-admin/firestore';

// Convert Firestore timestamps to Dates
export function convertTimestamps<T extends Record<string, any>>(data: T): T {
  const converted = { ...data };
  for (const key in converted) {
    if (converted[key] && typeof converted[key] === 'object') {
      if (converted[key].toDate && typeof converted[key].toDate === 'function') {
        converted[key] = converted[key].toDate();
      } else if (Array.isArray(converted[key])) {
        converted[key] = converted[key].map((item: any) => 
          item?.toDate ? item.toDate() : convertTimestamps(item)
        );
      }
    }
  }
  return converted;
}

// Convert Dates to Firestore Timestamps
export function prepareForFirestore<T extends Record<string, any>>(data: T): any {
  const prepared: any = {};
  for (const key in data) {
    // Skip undefined values - Firestore doesn't accept them
    if (data[key] === undefined) {
      continue;
    }
    const value = data[key] as any;
    if (value instanceof Date) {
      prepared[key] = Timestamp.fromDate(value);
    } else if (Array.isArray(data[key])) {
      prepared[key] = data[key];
    } else if (data[key] && typeof data[key] === 'object') {
      prepared[key] = prepareForFirestore(data[key]);
    } else {
      prepared[key] = data[key];
    }
  }
  return prepared;
}

// Request operations
export async function createRequest(request: Omit<Request, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const now = new Date();
  const requestData = {
    ...prepareForFirestore(request),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  const docRef = await adminDb.collection('requests').add(requestData);
  return docRef.id;
}

export async function updateRequest(id: string, updates: Partial<Request>): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const updateData = {
    ...prepareForFirestore(updates),
    updatedAt: Timestamp.fromDate(new Date()),
  };
  
  await adminDb.collection('requests').doc(id).update(updateData);
}

export async function linkRequestToEvent(requestId: string, eventId: string): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  await adminDb.collection('requests').doc(requestId).update({
    relatedEventId: eventId,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

export async function getRequest(id: string): Promise<Request | null> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const doc = await adminDb.collection('requests').doc(id).get();
  if (!doc.exists) return null;
  
  return convertTimestamps({ id: doc.id, ...doc.data() } as Request);
}

export async function getRequests(filters?: { status?: string; decision?: string; type?: RequestType }): Promise<Request[]> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  let query: any = adminDb.collection('requests');
  
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.decision) {
    query = query.where('decision', '==', filters.decision);
  }
  if (filters?.type) {
    query = query.where('requestType', '==', filters.type);
  }
  
  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc: any) => convertTimestamps({ id: doc.id, ...doc.data() } as Request));
}

// Event operations
export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const now = new Date();
  const eventData = {
    ...prepareForFirestore(event),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  const docRef = await adminDb.collection('events').add(eventData);
  return docRef.id;
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const updateData = {
    ...prepareForFirestore(updates),
    updatedAt: Timestamp.fromDate(new Date()),
  };
  
  await adminDb.collection('events').doc(id).update(updateData);
}

export async function getEvent(id: string): Promise<Event | null> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const doc = await adminDb.collection('events').doc(id).get();
  if (!doc.exists) return null;
  
  return convertTimestamps({ id: doc.id, ...doc.data() } as Event);
}

export async function getEvents(filters?: { status?: string; isPublic?: boolean }): Promise<Event[]> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  let query: any = adminDb.collection('events');
  
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.isPublic !== undefined) {
    query = query.where('isPublicEvent', '==', filters.isPublic);
  }
  
  const snapshot = await query.orderBy('date', 'asc').get();
  return snapshot.docs.map((doc: any) => convertTimestamps({ id: doc.id, ...doc.data() } as Event));
}

// Person operations
export async function createPerson(person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const now = new Date();
  const personData = {
    ...prepareForFirestore(person),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  const docRef = await adminDb.collection('people').add(personData);
  return docRef.id;
}

export async function updatePerson(id: string, updates: Partial<Person>): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const updateData = {
    ...prepareForFirestore(updates),
    updatedAt: Timestamp.fromDate(new Date()),
  };
  
  await adminDb.collection('people').doc(id).update(updateData);
}

export async function getPerson(id: string): Promise<Person | null> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const doc = await adminDb.collection('people').doc(id).get();
  if (!doc.exists) return null;
  
  return convertTimestamps({ id: doc.id, ...doc.data() } as Person);
}

export async function addPersonNote(personId: string, note: { note: string; createdBy: string; type?: string }): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const noteData = {
    id: adminDb.collection('temp').doc().id, // Generate ID
    ...note,
    date: Timestamp.fromDate(new Date()),
  };
  
  const personRef = adminDb.collection('people').doc(personId);
  const personDoc = await personRef.get();
  const person = personDoc.data() as Person;
  
  const notes = person?.notes || [];
  notes.push(convertTimestamps(noteData) as any);
  
  await personRef.update({
    notes,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

// Newsletter operations
export async function createNewsletterSignup(name: string, email: string): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const signupData: NewsletterSignup = {
    name,
    email,
    subscribedAt: new Date(),
    isActive: true,
  };
  
  const docRef = await adminDb.collection('newsletter').add(prepareForFirestore(signupData));
  return docRef.id;
}

export async function getNewsletterSignups(): Promise<NewsletterSignup[]> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const snapshot = await adminDb.collection('newsletter')
    .where('isActive', '==', true)
    .orderBy('subscribedAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc: any) => convertTimestamps({ id: doc.id, ...doc.data() } as NewsletterSignup));
}

// Volunteer operations
export async function createVolunteer(volunteer: Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const now = new Date();
  const volunteerData = {
    ...prepareForFirestore(volunteer),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  const docRef = await adminDb.collection('volunteers').add(volunteerData);
  return docRef.id;
}

export async function getVolunteers(): Promise<Volunteer[]> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const snapshot = await adminDb.collection('volunteers')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc: any) => convertTimestamps({ id: doc.id, ...doc.data() } as Volunteer));
}

// Task operations
export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const now = new Date();
  const taskData = {
    ...prepareForFirestore(task),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  const docRef = await adminDb.collection('tasks').add(taskData);
  return docRef.id;
}

export async function getTasks(filters?: { assignedTo?: string; status?: string; relatedEventId?: string }): Promise<Task[]> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  let query: any = adminDb.collection('tasks');
  
  if (filters?.assignedTo) {
    query = query.where('assignedTo', '==', filters.assignedTo);
  }
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.relatedEventId) {
    query = query.where('relatedEventId', '==', filters.relatedEventId);
  }
  
  const snapshot = await query.orderBy('dueDate', 'asc').get();
  return snapshot.docs.map((doc: any) => convertTimestamps({ id: doc.id, ...doc.data() } as Task));
}

// Schedule operations
export async function createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  const now = new Date();
  const scheduleData = {
    ...prepareForFirestore(schedule),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  
  const docRef = await adminDb.collection('schedules').add(scheduleData);
  return docRef.id;
}

export async function getSchedules(filters?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<Schedule[]> {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  
  let query: any = adminDb.collection('schedules');
  
  if (filters?.startDate) {
    query = query.where('startTime', '>=', Timestamp.fromDate(filters.startDate));
  }
  if (filters?.endDate) {
    query = query.where('startTime', '<=', Timestamp.fromDate(filters.endDate));
  }
  
  const snapshot = await query.orderBy('startTime', 'asc').get();
  return snapshot.docs.map((doc: any) => convertTimestamps({ id: doc.id, ...doc.data() } as Schedule));
}

