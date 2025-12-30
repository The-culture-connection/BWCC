'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { Committee, Task, Meeting, Person, Event } from '@/lib/types/database';
import { getCurrentUser } from '@/lib/firebase/auth';

interface User {
  uid: string;
  email: string;
  name?: string;
  role: string;
}

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [committeeTasks, setCommitteeTasks] = useState<Task[]>([]);
  const [committeeMeetings, setCommitteeMeetings] = useState<Meeting[]>([]);
  const [committeePeople, setCommitteePeople] = useState<Person[]>([]);
  const [committeeEvents, setCommitteeEvents] = useState<Event[]>([]);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    minutes: '',
  });

  useEffect(() => {
    loadCommittees();
    loadUsers();
  }, []);

  useEffect(() => {
    console.log('[DEBUG] selectedCommittee changed:', selectedCommittee);
    if (selectedCommittee) {
      console.log('[DEBUG] Loading committee data for:', selectedCommittee.id);
      loadCommitteeData(selectedCommittee.id!);
    }
  }, [selectedCommittee]);

  // Reload users when Manage Members modal opens to ensure fresh data
  useEffect(() => {
    if (showAddMemberModal) {
      loadUsers();
    }
  }, [showAddMemberModal]);

  const loadCommittees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/committees');
      const data = await response.json();
      setCommittees(data.committees || []);
    } catch (error) {
      console.error('Error loading committees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCommitteeData = async (committeeId: string) => {
    // Load tasks
    try {
      const response = await fetch('/api/admin/tasks');
      const data = await response.json();
      const allTasks = data.tasks || [];
      setCommitteeTasks(allTasks.filter((task: Task) => task.assignedToCommittee === committeeId));
    } catch (error) {
      console.error('Error loading committee tasks:', error);
    }

    // Load meetings
    try {
      const response = await fetch(`/api/admin/meetings?committeeId=${committeeId}`);
      const data = await response.json();
      setCommitteeMeetings(data.meetings || []);
    } catch (error) {
      console.error('Error loading committee meetings:', error);
    }

    // Load people
    try {
      const response = await fetch('/api/admin/people');
      const data = await response.json();
      const allPeople = data.people || [];
      // Note: This assumes people can be linked to committees - you may need to add this field
      setCommitteePeople([]);
    } catch (error) {
      console.error('Error loading committee people:', error);
    }

    // Load events
    try {
      const response = await fetch('/api/admin/events');
      const data = await response.json();
      const allEvents = data.events || [];
      setCommitteeEvents(allEvents.filter((event: Event) => {
        const committeesArray = Array.isArray(event.relatedCommitteeIds) ? event.relatedCommitteeIds : [];
        return committeesArray.includes(committeeId);
      }));
    } catch (error) {
      console.error('Error loading committee events:', error);
    }
  };


  const handleCreateMeeting = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in');
      return;
    }

    if (!newMeeting.title.trim() || !newMeeting.date) {
      alert('Meeting title and date are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMeeting,
          committeeId: selectedCommittee?.id,
          createdBy: user.uid,
        }),
      });

      if (response.ok) {
        setNewMeeting({
          title: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          location: '',
          minutes: '',
        });
        setShowCreateMeeting(false);
        if (selectedCommittee) {
          loadCommitteeData(selectedCommittee.id!);
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Error creating meeting');
    }
  };

  const handleUpdateMeetingMinutes = async (meetingId: string, minutes: string) => {
    try {
      await fetch('/api/admin/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meetingId, minutes }),
      });
      if (selectedCommittee) {
        loadCommitteeData(selectedCommittee.id!);
      }
    } catch (error) {
      console.error('Error updating meeting minutes:', error);
      alert('Error updating meeting minutes');
    }
  };

  const handleExportPDF = (meeting: Meeting) => {
    // Simple PDF export using window.print or download as HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Meeting Minutes: ${meeting.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
    .minutes { white-space: pre-wrap; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${meeting.title}</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${new Date(meeting.date).toLocaleDateString()}</p>
    ${meeting.startTime ? `<p><strong>Start Time:</strong> ${new Date(meeting.startTime).toLocaleTimeString()}</p>` : ''}
    ${meeting.endTime ? `<p><strong>End Time:</strong> ${new Date(meeting.endTime).toLocaleTimeString()}</p>` : ''}
    ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
  </div>
  ${meeting.description ? `<div><strong>Description:</strong> ${meeting.description}</div><br>` : ''}
  <div class="minutes">
    <h2>Meeting Minutes</h2>
    ${meeting.minutes || 'No minutes recorded.'}
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Minutes_${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${new Date(meeting.date).toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateMembers = async (committeeId: string, members: string[]) => {
    try {
      const response = await fetch('/api/admin/committees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: committeeId, members }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update members');
      }
      
      // Reload committees list to update the card view
      await loadCommittees();
      
      // Reload the selected committee with fresh data from API
      if (selectedCommittee?.id === committeeId) {
        try {
          const committeeResponse = await fetch(`/api/admin/committees?id=${committeeId}`);
          const committeeData = await committeeResponse.json();
          if (committeeData.committee) {
            setSelectedCommittee(committeeData.committee);
          }
        } catch (error) {
          console.error('Error reloading committee:', error);
          // Fallback: update with the new members array
          setSelectedCommittee({ ...selectedCommittee, members });
        }
      }
    } catch (error) {
      console.error('Error updating committee members:', error);
      alert(`Error updating committee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Committees</h1>
        </div>

        {/* Committees List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((committee) => (
              <div
                key={committee.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={async () => {
                  // Fetch fresh data to ensure we have correct arrays
                  try {
                    const response = await fetch(`/api/admin/committees?id=${committee.id}`);
                    const data = await response.json();
                    if (data.committee) {
                      setSelectedCommittee(data.committee);
                    } else {
                      setSelectedCommittee(committee);
                    }
                  } catch (error) {
                    console.error('Error loading committee:', error);
                    setSelectedCommittee(committee);
                  }
                }}
              >
                <h3 className="text-xl font-bold text-brand-black mb-2">{committee.name}</h3>
                {committee.description && (
                  <p className="text-sm text-gray-600 mb-4">{committee.description}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Members: {committee.members?.length || 0}</p>
                  <p>Tasks: {committee.relatedTaskIds?.length || 0}</p>
                  <p>Meetings: {committee.relatedMeetingIds?.length || 0}</p>
                  <p>Events: {committee.relatedEventIds?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Committee Detail Modal */}
        {selectedCommittee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-black">{selectedCommittee.name}</h2>
                <button
                  onClick={() => setSelectedCommittee(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedCommittee.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-900">{selectedCommittee.description}</p>
                  </div>
                )}

                {/* Members Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Members</h3>
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="text-sm px-3 py-1 bg-brand-gold text-brand-black rounded hover:bg-brand-tan"
                    >
                      Manage Members
                    </button>
                  </div>
                  
                  {/* Current Members List - View Only */}
                  {(() => {
                    // Ensure members is an array
                    const membersArray = Array.isArray(selectedCommittee.members) ? selectedCommittee.members : [];
                    
                    if (membersArray.length === 0) {
                      return <p className="text-sm text-gray-500">No members added yet</p>;
                    }
                    
                    return (
                      <div className="space-y-2">
                        {membersArray.map((memberId) => {
                          const member = users.find(u => u.uid === memberId);
                          if (!member) return null;
                          return (
                            <div key={memberId} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{member.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500 ml-2">{member.email}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Meetings Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Meetings</h3>
                    <button
                      onClick={() => setShowCreateMeeting(true)}
                      className="text-sm px-3 py-1 bg-brand-gold text-brand-black rounded hover:bg-brand-tan"
                    >
                      + Create Meeting
                    </button>
                  </div>
                  
                  {showCreateMeeting && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">New Meeting</h4>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Meeting Title *"
                          value={newMeeting.title}
                          onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="date"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            placeholder="Start Time"
                            value={newMeeting.startTime}
                            onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="time"
                            placeholder="End Time"
                            value={newMeeting.endTime}
                            onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Location"
                          value={newMeeting.location}
                          onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <textarea
                          placeholder="Description"
                          value={newMeeting.description}
                          onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          rows={2}
                        />
                        <textarea
                          placeholder="Meeting Minutes"
                          value={newMeeting.minutes}
                          onChange={(e) => setNewMeeting({ ...newMeeting, minutes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateMeeting}
                            className="flex-1 px-3 py-2 bg-brand-gold text-brand-black rounded hover:bg-brand-tan text-sm"
                          >
                            Create
                          </button>
                          <button
                            onClick={() => setShowCreateMeeting(false)}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {committeeMeetings.length === 0 ? (
                      <p className="text-sm text-gray-500">No meetings yet</p>
                    ) : (
                      committeeMeetings.map((meeting) => (
                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{meeting.title}</h4>
                              <p className="text-xs text-gray-500">
                                {new Date(meeting.date).toLocaleDateString()}
                                {meeting.startTime && ` at ${new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                {meeting.location && ` • ${meeting.location}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleExportPDF(meeting)}
                              className="text-xs px-2 py-1 bg-brand-gold text-brand-black rounded hover:bg-brand-tan"
                            >
                              Export PDF
                            </button>
                          </div>
                          {meeting.description && (
                            <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                          )}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Meeting Minutes</label>
                            <textarea
                              value={meeting.minutes || ''}
                              onChange={(e) => handleUpdateMeetingMinutes(meeting.id!, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={4}
                              placeholder="Add meeting minutes..."
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tasks Section */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Tasks</h3>
                  <div className="space-y-2">
                    {committeeTasks.length === 0 ? (
                      <p className="text-sm text-gray-500">No tasks assigned</p>
                    ) : (
                      committeeTasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <p className="text-xs text-gray-500">
                                {task.status} • {task.priority}
                                {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Events Section */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Events</h3>
                  <div className="space-y-3">
                    {committeeEvents.length === 0 ? (
                      <p className="text-sm text-gray-500">No events assigned</p>
                    ) : (
                      committeeEvents.map((event) => (
                        <div 
                          key={event.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:border-brand-gold hover:shadow-md transition cursor-pointer"
                          onClick={() => {
                            setSelectedCommittee(null);
                            window.location.href = `/admin/events?eventId=${event.id}`;
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-brand-black mb-2">{event.eventTitle}</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Type:</span> {event.eventType}
                                  <span className="ml-3 font-medium">Status:</span> 
                                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                                    event.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    event.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {event.status}
                                  </span>
                                </p>
                                {event.date && (
                                  <p>
                                    <span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString()}
                                    {event.startTime && ` at ${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                  </p>
                                )}
                                {event.location && (
                                  <p><span className="font-medium">Location:</span> {event.location}</p>
                                )}
                                {event.purpose && (
                                  <p className="text-xs text-gray-500 mt-1">{event.purpose}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">Click to view event details →</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Members Modal */}
        {showAddMemberModal && selectedCommittee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-black">Manage Members</h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Current Members */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Members</h4>
                {(() => {
                  const membersArray = Array.isArray(selectedCommittee.members) ? selectedCommittee.members : [];
                  
                  if (membersArray.length === 0) {
                    return <p className="text-sm text-gray-500">No members assigned</p>;
                  }
                  
                  return (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {membersArray.map((memberId) => {
                        const member = users.find(u => u.uid === memberId);
                        if (!member) return null;
                        return (
                          <div key={memberId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{member.name || 'Unknown'}</span>
                              <span className="text-xs text-gray-500 ml-2">{member.email}</span>
                            </div>
                            <button
                              onClick={() => {
                                const newMembers = membersArray.filter(id => id !== memberId);
                                handleUpdateMembers(selectedCommittee.id!, newMembers);
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
              
              {/* Available Users to Add */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Members</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500">No users available</p>
                  ) : (
                    users
                      .filter(u => {
                        const membersArray = Array.isArray(selectedCommittee.members) ? selectedCommittee.members : [];
                        return !membersArray.includes(u.uid);
                      })
                      .map((user) => (
                        <button
                          key={user.uid}
                          onClick={() => {
                            const currentMembers = Array.isArray(selectedCommittee.members) ? selectedCommittee.members : [];
                            handleUpdateMembers(selectedCommittee.id!, [...currentMembers, user.uid]);
                          }}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{user.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500 ml-2">{user.email}</span>
                            <span className="text-xs text-gray-400 ml-2">({user.role})</span>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowAddMemberModal(false)}
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
