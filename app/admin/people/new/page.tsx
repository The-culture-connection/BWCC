'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PeopleRole } from '@/lib/types/database';

export default function NewPersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Contact' as PeopleRole,
    email: '',
    phone: '',
    organization: '',
    expertiseAreas: '',
    bio: '',
    headshot: '',
    availabilityNotes: '',
    relatedEventIds: [] as string[],
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await fetch('/api/admin/events/select');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEventSelection = (eventId: string) => {
    setFormData(prev => {
      const isSelected = prev.relatedEventIds.includes(eventId);
      return {
        ...prev,
        relatedEventIds: isSelected 
          ? prev.relatedEventIds.filter(id => id !== eventId)
          : [...prev.relatedEventIds, eventId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const personData = {
        ...formData,
        expertiseAreas: formData.expertiseAreas
          ? formData.expertiseAreas.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        relatedEventIds: formData.relatedEventIds.length > 0 ? formData.relatedEventIds : undefined,
        status: 'Approved', // Admin-created people are automatically approved
      };

      const response = await fetch('/api/admin/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personData),
      });

      if (response.ok) {
        router.push('/admin/people');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create person');
      }
    } catch (error) {
      console.error('Error creating person:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-brand-gold hover:text-brand-brown mb-4"
          >
            ← Back to People & Partners
          </button>
          <h1 className="text-3xl font-bold text-brand-black">Add New Person</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Contact">Contact</option>
                <option value="Partner">Partner</option>
                <option value="Panelist">Panelist</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Podcast Guest">Podcast Guest</option>
                <option value="Board Member">Board Member</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expertise Areas (comma-separated)
            </label>
            <input
              type="text"
              name="expertiseAreas"
              value={formData.expertiseAreas}
              onChange={handleChange}
              placeholder="e.g. Mental Health, Community Engagement, Education"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headshot URL
            </label>
            <input
              type="url"
              name="headshot"
              value={formData.headshot}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability Notes
            </label>
            <textarea
              name="availabilityNotes"
              value={formData.availabilityNotes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Event Assignment Section */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign to Events (optional)
            </label>
            {loadingEvents ? (
              <p className="text-sm text-gray-500">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-gray-500">No events available</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {events.map((event) => {
                  const eventDate = event.date ? new Date(event.date).toLocaleDateString() : 'TBD';
                  const eventTime = event.startTime ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  const displayText = `${event.title} - ${eventDate}${eventTime ? ` at ${eventTime}` : ''}`;
                  
                  return (
                    <label key={event.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.relatedEventIds.includes(event.id)}
                        onChange={() => handleEventSelection(event.id)}
                        className="text-brand-gold focus:ring-brand-gold"
                      />
                      <span className="text-sm text-gray-700">{displayText}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {formData.relatedEventIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {formData.relatedEventIds.length} event(s) selected
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Person'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
