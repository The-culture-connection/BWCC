'use client';

import AdminLayout from '@/components/AdminLayout';
import SuggestionButton from '@/components/SuggestionButton';
import { useEffect, useState } from 'react';
import { Person, InteractionNote, PersonStatus } from '@/lib/types/database';
import { getCurrentUser } from '@/lib/firebase/auth';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'call' | 'email' | 'meeting' | 'event' | 'other'>('other');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionDescription, setSuggestionDescription] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadPeople();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadPeople = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/people');
      const data = await response.json();
      setPeople(data.people || []);
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedPerson || !newNote.trim()) return;

    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in to add notes');
      return;
    }

    try {
      await fetch('/api/admin/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPerson.id,
          note: newNote,
          createdBy: user.uid,
          type: noteType,
        }),
      });
      setNewNote('');
      loadPeople();
      // Reload selected person
      const response = await fetch(`/api/admin/people?id=${selectedPerson.id}`);
      const data = await response.json();
      setSelectedPerson(data.person);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">People & Partners</h1>
          <a
            href="/admin/people/new"
            className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-semibold"
          >
            + Add Person
          </a>
        </div>

        {/* People List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {people.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPerson(person)}
                        className="text-left text-sm font-medium text-brand-black hover:text-brand-gold"
                      >
                        {person.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{person.organization || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedPerson(person)}
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

        {/* Person Detail Modal */}
        {selectedPerson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-black">{selectedPerson.name}</h2>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                  <div className="space-y-1">
                    <p className="text-gray-900">Role: {selectedPerson.role}</p>
                    {selectedPerson.email && <p className="text-gray-900">Email: {selectedPerson.email}</p>}
                    {selectedPerson.phone && <p className="text-gray-900">Phone: {selectedPerson.phone}</p>}
                    {selectedPerson.organization && <p className="text-gray-900">Organization: {selectedPerson.organization}</p>}
                  </div>
                </div>

                {selectedPerson.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Bio</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedPerson.bio}</p>
                  </div>
                )}


                {selectedPerson.expertiseAreas && (
                  (() => {
                    // Handle expertiseAreas - convert to array if it's an object with numeric keys
                    let areasArray: string[] = [];
                    if (Array.isArray(selectedPerson.expertiseAreas)) {
                      areasArray = selectedPerson.expertiseAreas.filter(area => typeof area === 'string');
                    } else if (typeof selectedPerson.expertiseAreas === 'object') {
                      // Convert object with numeric keys back to array of strings
                      areasArray = Object.values(selectedPerson.expertiseAreas).filter(area => typeof area === 'string');
                    } else if (typeof selectedPerson.expertiseAreas === 'string') {
                      areasArray = [selectedPerson.expertiseAreas];
                    }
                    
                    if (areasArray.length === 0) return null;
                    
                    return (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Expertise Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {areasArray.map((area, idx) => (
                            <span key={idx} className="px-2 py-1 bg-brand-cream text-brand-black rounded text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
                )}

                {/* Actions Section */}
                {(selectedPerson.role === 'Panelist' || selectedPerson.role === 'Volunteer' || selectedPerson.role === 'Podcast Guest') && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Actions</h3>
                    
                    {/* Related Events */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Events</label>
                      {(() => {
                        const eventsArray = Array.isArray(selectedPerson.relatedEventIds) ? selectedPerson.relatedEventIds : [];
                        
                        if (eventsArray.length === 0) {
                          return <p className="text-sm text-gray-500">No events assigned</p>;
                        }
                        
                        return (
                          <div className="space-y-2">
                            {eventsArray.map((eventId) => {
                              const event = events.find(e => e.id === eventId);
                              if (!event) return null;
                              return (
                                <div 
                                  key={eventId} 
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:border-brand-gold hover:shadow-md transition cursor-pointer"
                                  onClick={() => {
                                    setSelectedPerson(null);
                                    window.location.href = `/admin/events?eventId=${eventId}`;
                                  }}
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{event.eventTitle}</div>
                                    <div className="text-xs text-gray-500">
                                      {event.date && new Date(event.date).toLocaleDateString()}
                                      {event.startTime && ` at ${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400 ml-2">Click to view →</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Current Status */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        selectedPerson.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        selectedPerson.status === 'Denied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedPerson.status || 'Pending'}
                      </span>
                    </div>

                    {/* Approve/Deny Actions */}
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/admin/people', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                id: selectedPerson.id,
                                status: 'Approved'
                              }),
                            });
                            const response = await fetch(`/api/admin/people?id=${selectedPerson.id}`);
                            const data = await response.json();
                            setSelectedPerson(data.person);
                            alert('Person approved successfully');
                          } catch (error) {
                            console.error('Error approving person:', error);
                            alert('Error approving person');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/admin/people', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                id: selectedPerson.id,
                                status: 'Denied'
                              }),
                            });
                            const response = await fetch(`/api/admin/people?id=${selectedPerson.id}`);
                            const data = await response.json();
                            setSelectedPerson(data.person);
                            alert('Person denied');
                          } catch (error) {
                            console.error('Error denying person:', error);
                            alert('Error denying person');
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        ✗ Deny
                      </button>
                    </div>

                    {/* Send Confirmation Email / Event Invite */}
                    {selectedPerson.status === 'Approved' && (
                      <div className="mb-4">
                        <button
                          onClick={async () => {
                            try {
                              // Track in MVP 2 bucket
                              const mvp2Response = await fetch('/api/admin/mvp2', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  personId: selectedPerson.id,
                                  action: 'send_confirmation_email',
                                  metadata: {
                                    email: selectedPerson.email,
                                    name: selectedPerson.name,
                                  }
                                }),
                              });
                              
                              const mvp2Data = await mvp2Response.json();
                              
                              await fetch('/api/admin/people', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  id: selectedPerson.id, 
                                  sendConfirmationEmail: true 
                                }),
                              });
                              const response = await fetch(`/api/admin/people?id=${selectedPerson.id}`);
                              const data = await response.json();
                              setSelectedPerson(data.person);
                              alert(`Confirmation email/event invite sent. (Email functionality to be implemented) - Tracked as action #${mvp2Data.index}`);
                            } catch (error) {
                              console.error('Error sending confirmation email:', error);
                              alert('Error sending confirmation email');
                            }
                          }}
                          className="w-full px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan text-sm font-medium"
                        >
                          📧 Send Confirmation Email / Event Invite
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Send confirmation email and event invite to {selectedPerson.email || 'the person'}
                        </p>
                      </div>
                    )}

                    {/* Submit Suggestion */}
                    <button
                      onClick={() => setShowSuggestionModal(true)}
                      className="px-3 py-2 bg-brand-gold text-brand-black rounded hover:bg-brand-tan text-sm font-medium"
                    >
                      💡 Submit Suggestion
                    </button>
                  </div>
                )}

                {/* Suggestion Modal */}
                {showSuggestionModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-brand-black">Submit Suggestion</h2>
                        <button
                          onClick={() => {
                            setShowSuggestionModal(false);
                            setSuggestionDescription('');
                            setSuggestionCategory('');
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <textarea
                            value={suggestionDescription}
                            onChange={(e) => setSuggestionDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            rows={4}
                            placeholder="Describe the feature or functionality you'd like to suggest..."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category (optional)
                          </label>
                          <input
                            type="text"
                            value={suggestionCategory}
                            onChange={(e) => setSuggestionCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="e.g. UI, Feature, Bug Fix"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={async () => {
                              if (!suggestionDescription.trim()) {
                                alert('Please enter a description');
                                return;
                              }

                              try {
                                const response = await fetch('/api/admin/suggestions', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    description: suggestionDescription.trim(), 
                                    category: suggestionCategory.trim() || undefined 
                                  }),
                                });

                                if (response.ok) {
                                  alert('Thank you for your suggestion!');
                                  setSuggestionDescription('');
                                  setSuggestionCategory('');
                                  setShowSuggestionModal(false);
                                } else {
                                  const data = await response.json();
                                  alert(data.error || 'Failed to submit suggestion');
                                }
                              } catch (error) {
                                console.error('Error submitting suggestion:', error);
                                alert('Error submitting suggestion');
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => {
                              setShowSuggestionModal(false);
                              setSuggestionDescription('');
                              setSuggestionCategory('');
                            }}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">Interaction Notes</h3>
                  
                  {/* Add Note Form */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                      rows={3}
                    />
                    <div className="flex gap-2 items-center">
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="event">Event</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        onClick={handleAddNote}
                        className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {selectedPerson.notes && selectedPerson.notes.length > 0 ? (
                      selectedPerson.notes.map((note: InteractionNote) => (
                        <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500">
                              {new Date(note.date).toLocaleDateString()} {note.type && `• ${note.type}`}
                            </span>
                          </div>
                          <p className="text-gray-900">{note.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No notes yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <SuggestionButton />
    </AdminLayout>
  );
}

