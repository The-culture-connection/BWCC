'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { Event, Person } from '@/lib/types/database';
import EventTasksSection from '@/components/EventTasksSection';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [committees, setCommittees] = useState<Array<{ id: string; name: string }>>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string }>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showManageCommitteesModal, setShowManageCommitteesModal] = useState(false);

  useEffect(() => {
    loadEvents();
    loadCommittees();
    loadPeople();
  }, [filter]);

  const loadCommittees = async () => {
    try {
      const response = await fetch('/api/admin/committees');
      const data = await response.json();
      setCommittees(data.committees || []);
    } catch (error) {
      console.error('Error loading committees:', error);
    }
  };

  const loadPeople = async () => {
    try {
      const response = await fetch('/api/admin/people');
      const data = await response.json();
      setPeople(data.people || []);
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      
      const response = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleUpdateCommittees = async (id: string, relatedCommitteeIds: string[]) => {
    try {
      // Ensure relatedCommitteeIds is an array of strings
      const committeesArray = Array.isArray(relatedCommitteeIds) ? relatedCommitteeIds.filter(c => typeof c === 'string') : [];
      
      const response = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, relatedCommitteeIds: committeesArray }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error updating committees: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      // Reload events to get fresh data
      await loadEvents();
      
      // Reload the selected event with fresh data
      if (selectedEvent?.id === id) {
        try {
          const eventResponse = await fetch(`/api/admin/events?id=${id}`);
          const eventData = await eventResponse.json();
          if (eventData.event) {
            setSelectedEvent(eventData.event);
          }
        } catch (error) {
          console.error('Error reloading event:', error);
        }
      }
    } catch (error) {
      console.error('Error updating event committees:', error);
      alert(`Error updating committees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Events</h1>
          <a
            href="/admin/events/new"
            className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-semibold"
          >
            + Add Event
          </a>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ status: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={async () => {
                          // Fetch full event data to ensure relatedPersonIds is populated
                          try {
                            const response = await fetch(`/api/admin/events?id=${event.id}`);
                            const data = await response.json();
                            if (data.event) {
                              setSelectedEvent(data.event);
                            } else {
                              setSelectedEvent(event);
                            }
                          } catch (error) {
                            console.error('Error loading event details:', error);
                            setSelectedEvent(event);
                          }
                        }}
                        className="text-left text-sm font-medium text-brand-black hover:text-brand-gold"
                      >
                        {event.eventTitle}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.eventType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.date ? new Date(event.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{event.location || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        event.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.isPublicEvent ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={async () => {
                          // Fetch full event data to ensure relatedPersonIds is populated
                          try {
                            const response = await fetch(`/api/admin/events?id=${event.id}`);
                            const data = await response.json();
                            if (data.event) {
                              setSelectedEvent(data.event);
                            } else {
                              setSelectedEvent(event);
                            }
                          } catch (error) {
                            console.error('Error loading event details:', error);
                            setSelectedEvent(event);
                          }
                        }}
                        className="text-brand-gold hover:text-brand-brown"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-black">{selectedEvent.eventTitle}</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Status</h3>
                    <select
                      value={selectedEvent.status}
                      onChange={(e) => handleUpdateStatus(selectedEvent.id!, e.target.value)}
                      className="mt-1 px-4 py-2 border border-gray-300 rounded-lg w-full"
                    >
                      <option value="Requested">Requested</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-700">Committees</h3>
                      <button
                        onClick={() => setShowManageCommitteesModal(true)}
                        className="text-sm px-3 py-1 bg-brand-gold text-brand-black rounded hover:bg-brand-tan"
                      >
                        Manage Committees
                      </button>
                    </div>
                    
                    {/* Current Committees List - View Only */}
                    {(() => {
                      // Ensure relatedCommitteeIds is an array
                      const committeesArray = Array.isArray(selectedEvent.relatedCommitteeIds) ? selectedEvent.relatedCommitteeIds : [];
                      
                      if (committeesArray.length === 0) {
                        return <p className="text-sm text-gray-500">No committees assigned</p>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {committeesArray.map((committeeId) => {
                            const committee = committees.find(c => c.id === committeeId);
                            if (!committee) return null;
                            return (
                              <div key={committeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">{committee.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">People & Partners</h3>
                    {(() => {
                      const peopleArray = Array.isArray(selectedEvent.relatedPersonIds) ? selectedEvent.relatedPersonIds : [];
                      
                      if (peopleArray.length === 0) {
                        return <p className="text-sm text-gray-500">No people assigned</p>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {peopleArray.map((personId) => {
                            const person = people.find(p => p.id === personId);
                            if (!person) return null;
                            return (
                              <div key={personId} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">{person.name}</span>
                                    <span className="text-xs text-gray-500">({person.role})</span>
                                    {person.status && (
                                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                        person.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        person.status === 'Denied' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {person.status}
                                      </span>
                                    )}
                                  </div>
                                  {person.email && (
                                    <div className="text-xs text-gray-500 mt-1">{person.email}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Date & Time</h3>
                  <p className="text-gray-900">
                    {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : '-'}
                    {selectedEvent.startTime && ` at ${new Date(selectedEvent.startTime).toLocaleTimeString()}`}
                    {selectedEvent.endTime && ` - ${new Date(selectedEvent.endTime).toLocaleTimeString()}`}
                  </p>
                </div>
                {selectedEvent.location && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Location</h3>
                    <p className="text-gray-900">{selectedEvent.location}</p>
                  </div>
                )}
                {selectedEvent.purpose && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Purpose</h3>
                    <p className="text-gray-900">{selectedEvent.purpose}</p>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Description</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Tasks Section */}
                <div className="border-t pt-4 mt-4">
                  <EventTasksSection eventId={selectedEvent.id!} />
                </div>

                {/* Event Content Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-700 mb-4">Event Content</h3>
                  <EventContentSection eventId={selectedEvent.id!} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Committees Modal */}
        {showManageCommitteesModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-black">Manage Committees</h3>
                <button
                  onClick={() => setShowManageCommitteesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Current Committees */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Committees</h4>
                {(() => {
                  // Ensure relatedCommitteeIds is an array
                  const committeesArray = Array.isArray(selectedEvent.relatedCommitteeIds) ? selectedEvent.relatedCommitteeIds : [];
                  
                  if (committeesArray.length === 0) {
                    return <p className="text-sm text-gray-500">No committees assigned</p>;
                  }
                  
                  return (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {committeesArray.map((committeeId) => {
                        const committee = committees.find(c => c.id === committeeId);
                        if (!committee) return null;
                        return (
                          <div key={committeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-900">{committee.name}</span>
                            <button
                              onClick={() => {
                                const newCommittees = committeesArray.filter(id => id !== committeeId);
                                handleUpdateCommittees(selectedEvent.id!, newCommittees);
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              
              {/* Available Committees to Add */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Committees</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {committees.length === 0 ? (
                    <p className="text-sm text-gray-500">No committees available</p>
                  ) : (
                    committees
                      .filter(c => {
                        const committeesArray = Array.isArray(selectedEvent.relatedCommitteeIds) ? selectedEvent.relatedCommitteeIds : [];
                        return !committeesArray.includes(c.id);
                      })
                      .map((committee) => (
                        <button
                          key={committee.id}
                          onClick={() => {
                            const currentCommittees = Array.isArray(selectedEvent.relatedCommitteeIds) ? selectedEvent.relatedCommitteeIds : [];
                            handleUpdateCommittees(selectedEvent.id!, [...currentCommittees, committee.id]);
                          }}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm text-gray-900"
                        >
                          {committee.name}
                        </button>
                      ))
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowManageCommitteesModal(false)}
                className="mt-4 w-full px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function EventContentSection({ eventId }: { eventId: string }) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState('');
  const [feedback, setFeedback] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContent();
  }, [eventId]);

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/content`);
      const data = await response.json();
      setContent(data.content);
      if (data.content) {
        setNotes(data.content.notes || '');
        setAttendance(data.content.attendance?.toString() || '');
        setFeedback(data.content.feedback || '');
        setFollowUp(data.content.followUp || '');
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      await fetch(`/api/admin/events/${eventId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          attendance: attendance ? parseInt(attendance) : undefined,
          feedback,
          followUp,
        }),
      });
      alert('Content saved successfully');
      loadContent();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/events/${eventId}/content/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        loadContent();
      } else {
        alert('Error uploading file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  if (loading) return <div className="text-gray-500">Loading content...</div>;

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Content</label>
        <label className="inline-flex items-center px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan cursor-pointer text-sm font-medium">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          {uploading ? 'Uploading...' : '+ Upload File'}
        </label>
        <p className="text-xs text-gray-500 mt-1">Upload photos, videos, or documents</p>
      </div>

      {/* Uploaded Files */}
      {content && (content.photos?.length > 0 || content.videos?.length > 0 || content.documents?.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
          <div className="space-y-2">
            {content.photos?.map((url: string, idx: number) => {
              const urlString = typeof url === 'string' ? url : String(url);
              const fileName = urlString.split('/').pop() || 'Photo';
              return (
                <div key={`photo-${idx}`} className="flex items-center gap-2">
                  <img src={urlString} alt={`Photo ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                  <a href={urlString} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-gold hover:text-brand-brown truncate flex-1">
                    {fileName}
                  </a>
                </div>
              );
            })}
            {content.videos?.map((url: string, idx: number) => {
              const urlString = typeof url === 'string' ? url : String(url);
              const fileName = urlString.split('/').pop() || 'Video';
              return (
                <div key={`video-${idx}`} className="flex items-center gap-2">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">Video</div>
                  <a href={urlString} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-gold hover:text-brand-brown truncate flex-1">
                    {fileName}
                  </a>
                </div>
              );
            })}
            {content.documents?.map((url: string, idx: number) => {
              const urlString = typeof url === 'string' ? url : String(url);
              const fileName = urlString.split('/').pop() || 'Document';
              return (
                <div key={`doc-${idx}`} className="flex items-center gap-2">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">Doc</div>
                  <a href={urlString} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-gold hover:text-brand-brown truncate flex-1">
                    {fileName}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={4}
          placeholder="Add notes about the event..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
        <input
          type="number"
          value={attendance}
          onChange={(e) => setAttendance(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Number of attendees"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Event feedback..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up</label>
        <textarea
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Follow-up actions or notes..."
        />
      </div>
      <button
        onClick={handleSaveContent}
        className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
      >
        Save Content
      </button>
    </div>
  );
}

