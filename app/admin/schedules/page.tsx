'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { Schedule } from '@/lib/types/database';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getCalendarFeedUrl } from '@/lib/utils/get-base-url';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'other' as Schedule['type'],
    isPrivate: true,
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in to create schedules');
      return;
    }

    try {
      await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSchedule,
          startTime: `${newSchedule.startTime}:00`,
          endTime: newSchedule.endTime ? `${newSchedule.endTime}:00` : undefined,
          createdBy: user.uid,
        }),
      });
      setShowCreateModal(false);
      setNewSchedule({ title: '', description: '', startTime: '', endTime: '', location: '', type: 'other', isPrivate: true });
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.startTime).toISOString().split('T')[0];
    return scheduleDate === selectedDate;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Schedules</h1>
          <div className="flex gap-4">
            <a
              href={getCalendarFeedUrl(true)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-gold hover:text-brand-black font-medium flex items-center gap-2"
            >
              📅 Subscribe to Private Calendar
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
            >
              Add Schedule Item
            </button>
          </div>
        </div>
        
        {/* Private Calendar Info */}
        <div className="bg-brand-cream rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-brand-black mb-2">Private Calendar Subscription</h2>
          <p className="text-gray-700 mb-4">
            Subscribe to the private calendar to automatically receive all private events, meetings, and schedules.
            Click the button above or copy the URL below to add to your calendar application.
          </p>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2 font-medium">Calendar Feed URL:</p>
            <code className="text-xs bg-gray-100 p-2 rounded block break-all">
              {getCalendarFeedUrl(true)}
            </code>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">View Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Schedules List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {filteredSchedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No schedule items for this date
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-brand-black">{schedule.title}</h3>
                          {schedule.isPrivate && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Private</span>
                          )}
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{schedule.type}</span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {schedule.endTime && ` - ${new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        {schedule.location && (
                          <p className="text-sm text-gray-500 mb-2">📍 {schedule.location}</p>
                        )}
                        {schedule.description && (
                          <p className="text-gray-700">{schedule.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Schedule Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-brand-black mb-4">Add Schedule Item</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Start Time</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time (optional)</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newSchedule.location}
                    onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as Schedule['type'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="event">Event</option>
                    <option value="task">Task</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newSchedule.isPrivate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, isPrivate: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-700">Private (only visible to team)</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCreateSchedule}
                    className="flex-1 px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

