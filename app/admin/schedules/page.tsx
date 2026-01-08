'use client';

import AdminLayout from '@/components/AdminLayout';
import SuggestionButton from '@/components/SuggestionButton';
import { useEffect, useState } from 'react';
import { Schedule, Event } from '@/lib/types/database';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getCalendarFeedUrl } from '@/lib/utils/get-base-url';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day';

interface CalendarItem {
  id: string;
  title: string;
  description: string;
  startTime: Date | string;
  endTime?: Date | string;
  location: string;
  type: 'event' | Schedule['type'];
  isPrivate: boolean;
  status?: string;
  eventType?: string;
}

export default function SchedulesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'other' as Schedule['type'],
    isPrivate: true,
  });
  const [subscriptionMessage, setSubscriptionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    loadEvents();
    loadSchedules();
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

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeToPrivateCalendar = async () => {
    const user = getCurrentUser();
    if (!user) {
      setSubscriptionMessage({ type: 'error', text: 'You must be logged in to subscribe to the private calendar' });
      setTimeout(() => setSubscriptionMessage(null), 5000);
      return;
    }

    setIsSubscribing(true);
    setSubscriptionMessage(null);

    const calendarEmail = 'bwccinternalcalendar@gmail.com';

    try {
      // Copy calendar email to clipboard
      await navigator.clipboard.writeText(calendarEmail);
      
      // Get the user's ID token
      const idToken = await user.getIdToken();

      // Call the API to update the user's subscription status
      const response = await fetch('/api/admin/users/subscribe-private-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Open Google Calendar add calendar page
        window.open('https://calendar.google.com/calendar/u/0/r/settings/addcalendar', '_blank');
        
        setSubscriptionMessage({ 
          type: 'success', 
          text: `Calendar email copied to clipboard! Google Calendar should be open in a new tab.\n\nNext steps:\n1. Paste the email (Ctrl+V or Cmd+V) in the "Add calendar" field\n2. Click "Add calendar"\n3. The calendar will automatically sync and show all private events.` 
        });
        // Clear message after 10 seconds
        setTimeout(() => setSubscriptionMessage(null), 10000);
      } else {
        setSubscriptionMessage({ 
          type: 'error', 
          text: data.error || 'Failed to subscribe to private calendar. Please try again.' 
        });
        setTimeout(() => setSubscriptionMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Error subscribing to private calendar:', error);
      // Still try to open the calendar page even if clipboard fails
      window.open('https://calendar.google.com/calendar/u/0/r/settings/addcalendar', '_blank');
      setSubscriptionMessage({ 
        type: 'error', 
        text: `Failed to copy to clipboard, but Google Calendar is opening. Please manually copy: ${calendarEmail}` 
      });
      setTimeout(() => setSubscriptionMessage(null), 10000);
    } finally {
      setIsSubscribing(false);
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

  // Combine events and schedules
  const allItems: CalendarItem[] = [
    ...events.map(event => ({
      id: event.id || '',
      title: event.eventTitle,
      description: event.description || event.purpose || '',
      startTime: event.startTime || event.date || new Date(),
      endTime: event.endTime,
      location: event.location || '',
      type: 'event' as const,
      isPrivate: false,
      status: event.status,
      eventType: event.eventType,
    })),
    ...schedules.map(schedule => ({
      id: schedule.id || '',
      title: schedule.title,
      description: schedule.description || '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location || '',
      type: schedule.type,
      isPrivate: schedule.isPrivate,
    })),
  ];

  // Get items for a specific date
  const getItemsForDate = (date: Date): CalendarItem[] => {
    return allItems.filter(item => {
      const itemDate = item.startTime instanceof Date ? item.startTime : new Date(item.startTime);
      return isSameDay(itemDate, date);
    }).sort((a, b) => {
      const timeA = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
      const timeB = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
      return timeA - timeB;
    });
  };

  // Navigation functions
  const previousPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const nextPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const firstDayOfMonth = getDay(monthStart);
    const daysArray: (Date | null)[] = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }
    
    daysArray.push(...daysInMonth);
    
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      weeks.push(daysArray.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 p-2 text-center font-semibold text-gray-700 text-sm">
              {day}
            </div>
          ))}
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`empty-${weekIndex}-${dayIndex}`} className="bg-white min-h-[100px] p-1" />;
              }

              const dayItems = getItemsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    bg-white min-h-[100px] p-1 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50
                    ${isCurrentMonth ? '' : 'bg-gray-50 opacity-60'}
                    ${isToday ? 'bg-brand-gold/20' : ''}
                    ${isSelected ? 'ring-2 ring-brand-gold' : ''}
                  `}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-brand-gold' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-1 rounded truncate bg-blue-100 text-blue-800"
                        title={item.title}
                      >
                        {format(item.startTime instanceof Date ? item.startTime : new Date(item.startTime), 'h:mm a')} {item.title}
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-2 border-r border-gray-200 bg-gray-50"></div>
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    p-2 text-center border-r border-gray-200 cursor-pointer
                    ${isToday ? 'bg-brand-gold/20 font-bold' : 'bg-gray-50'}
                    ${isSelected ? 'ring-2 ring-brand-gold' : ''}
                  `}
                >
                  <div className="text-xs text-gray-600">{format(day, 'EEE')}</div>
                  <div className={`text-lg ${isToday ? 'text-brand-gold' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8">
            <div className="border-r border-gray-200 bg-gray-50">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-16 border-b border-gray-100 p-1 text-xs text-gray-500">
                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </div>
              ))}
            </div>
            {weekDays.map((day) => {
              const dayItems = getItemsForDate(day);
              return (
                <div key={day.toISOString()} className="border-r border-gray-200">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} className="h-16 border-b border-gray-100 relative">
                      {dayItems
                        .filter(item => {
                          const itemDate = item.startTime instanceof Date ? item.startTime : new Date(item.startTime);
                          return itemDate.getHours() === hour;
                        })
                        .map((item) => (
                          <div
                            key={item.id}
                            className="absolute top-0 left-0 right-0 mx-1 bg-blue-500 text-white text-xs p-1 rounded truncate"
                            title={item.title}
                          >
                            {format(item.startTime instanceof Date ? item.startTime : new Date(item.startTime), 'h:mm a')} {item.title}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const dayItems = getItemsForDate(currentDate);

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {dayItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No events or schedules for this day</div>
          ) : (
            dayItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-20 text-sm text-gray-600">
                    {format(item.startTime instanceof Date ? item.startTime : new Date(item.startTime), 'h:mm a')}
                    {item.endTime && (
                      <>
                        <br />
                        {format(item.endTime instanceof Date ? item.endTime : new Date(item.endTime), 'h:mm a')}
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      {item.type === 'event' && item.status && (
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          item.status === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      )}
                      {item.eventType && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          {item.eventType}
                        </span>
                      )}
                      {item.isPrivate && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Private</span>
                      )}
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded capitalize">{item.type}</span>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <MapPin size={14} />
                        {item.location}
                      </div>
                    )}
                    {item.description && (
                      <p className="text-sm text-gray-700">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    if (viewType === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-brand-black">Schedules</h1>
          <div className="flex gap-4">
            <button
              onClick={handleSubscribeToPrivateCalendar}
              disabled={isSubscribing}
              className="px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-gold hover:text-brand-black font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarIcon size={18} />
              {isSubscribing ? 'Subscribing...' : 'Subscribe to Private Calendar'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
            >
              Add Schedule Item
            </button>
          </div>
        </div>
        
        {/* Private Calendar Info */}
        <div className="bg-brand-cream rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-bold text-brand-black mb-2">Private Calendar Subscription</h2>
          <p className="text-sm text-gray-700 mb-2">
            Subscribe to the private calendar to automatically receive all approved private events and meetings. Events are created on the Google Calendar and will appear in your calendar once you subscribe.
          </p>
          {subscriptionMessage && (
            <div className={`mb-3 p-3 rounded-lg whitespace-pre-line ${
              subscriptionMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {subscriptionMessage.text}
            </div>
          )}
          <div className="mb-3">
            <p className="text-sm font-semibold text-brand-black mb-2">Calendar Email:</p>
          <code className="text-xs bg-white p-2 rounded block break-all">
              bwccinternalcalendar@gmail.com
          </code>
          </div>
          <div className="mt-3 p-3 bg-white rounded border border-brand-gold/30">
            <p className="text-sm font-semibold text-brand-black mb-2">How to Subscribe:</p>
            <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
              <li>Click the &quot;Subscribe to Private Calendar&quot; button above</li>
              <li>The calendar email will be copied to your clipboard</li>
              <li>Google Calendar will open in a new tab</li>
              <li>Paste the email (Ctrl+V or Cmd+V) in the &quot;Add calendar&quot; field</li>
              <li>Click &quot;Add calendar&quot;</li>
              <li>Events will automatically sync and appear in your calendar</li>
            </ol>
          </div>
        </div>

        {/* View Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType('month')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewType === 'month' 
                      ? 'bg-brand-gold text-brand-black' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewType('week')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewType === 'week' 
                      ? 'bg-brand-gold text-brand-black' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewType('day')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewType === 'day' 
                      ? 'bg-brand-gold text-brand-black' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={previousPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-brand-black min-w-[200px] text-center">
                {getViewTitle()}
              </h2>
              <button
                onClick={nextPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Next"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {viewType === 'month' && renderMonthView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'day' && renderDayView()}
          </>
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
      <SuggestionButton />
    </AdminLayout>
  );
}
