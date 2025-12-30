'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, X, Copy, Check } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isValid } from 'date-fns';
import { getCalendarFeedUrl } from '@/lib/utils/get-base-url';

interface Event {
  id: string;
  title: string;
  purpose: string;
  startTime: string;
  location: string;
  date: string;
  isPublic: boolean;
}

export default function EventCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeType, setSubscribeType] = useState<'public' | 'private'>('public');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch public events only (status=Approved AND isPublicEvent=true)
      const response = await fetch('/api/events?private=false', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const copyFeedUrl = async () => {
    const url = getCalendarFeedUrl(subscribeType === 'private');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleSubscribeToCalendar = async (type: 'public' | 'private') => {
    // Get the calendar feed URL (public or private)
    const url = getCalendarFeedUrl(type === 'private');
    
    try {
      // Copy the calendar feed URL to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      // Open Google Calendar "Add by URL" page in a new tab
      window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank');
      
      // Show modal with instructions
      setSubscribeType(type);
      setShowSubscribeModal(true);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // If clipboard copy fails, still open the modal and Google Calendar
      setSubscribeType(type);
      setShowSubscribeModal(true);
      window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank');
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => {
      if (event.startTime && isValid(parseISO(event.startTime))) {
        return isSameDay(parseISO(event.startTime), date);
      }
      if (event.date && isValid(parseISO(event.date))) {
        return isSameDay(parseISO(event.date), date);
      }
      return false;
    });
  };

  // Calendar grid setup
  const firstDayOfMonth = getDay(monthStart);
  const daysArray: (Date | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  
  // Add all days of the month
  daysArray.push(...daysInMonth);

  // Group days into weeks
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    weeks.push(daysArray.slice(i, i + 7));
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-gold mb-4">
            Event Calendar
          </h2>
          <p className="text-xl text-brand-black/80 font-secondary max-w-2xl mx-auto mb-6">
            Subscribe to our calendar to automatically receive event updates
          </p>
          
          {/* Subscribe Button */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => handleSubscribeToCalendar('public')}
              className="bg-brand-gold text-brand-black px-6 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-secondary font-semibold flex items-center gap-2"
            >
              <Calendar size={20} />
              Subscribe to Public Calendar
            </button>
          </div>
        </motion.div>


        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-brand-black/70 font-secondary">Loading calendar...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-secondary">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-brand-cream">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-brand-cream rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={24} className="text-brand-black" />
              </button>
              <h3 className="text-2xl md:text-3xl font-primary font-bold text-brand-black">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-brand-cream rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={24} className="text-brand-black" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center font-secondary font-semibold text-brand-black/70 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={`empty-${weekIndex}-${dayIndex}`} className="aspect-square" />;
                  }

                  const dayEvents = getEventsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square p-2 border rounded-lg cursor-pointer transition-all
                        ${isCurrentMonth ? 'border-brand-tan hover:border-brand-gold' : 'border-gray-200 opacity-50'}
                        ${isToday ? 'bg-brand-gold/20 border-brand-gold' : ''}
                        ${isSelected ? 'ring-2 ring-brand-gold' : ''}
                        ${dayEvents.length > 0 ? 'bg-brand-cream/50' : ''}
                      `}
                    >
                      <div className="text-sm font-secondary font-semibold mb-1">
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs bg-brand-gold text-brand-black px-1 py-0.5 rounded truncate"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-brand-black/60 font-secondary">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Date Events */}
            {selectedDate && getEventsForDate(selectedDate).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-6 border-t border-brand-cream"
              >
                <h4 className="text-xl font-primary font-bold text-brand-black mb-4">
                  Events on {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h4>
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="bg-brand-cream/50 rounded-lg p-4 border border-brand-tan"
                    >
                      <h5 className="text-lg font-primary font-bold text-brand-black mb-2">
                        {event.title}
                      </h5>
                      {event.purpose && (
                        <p className="text-brand-black/80 font-secondary mb-3">
                          {event.purpose}
                        </p>
                      )}
                      <div className="space-y-1 text-sm font-secondary text-brand-black/70">
                        {event.startTime && isValid(parseISO(event.startTime)) && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-brand-gold" />
                            <span>{format(parseISO(event.startTime), 'h:mm a')}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-brand-gold" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Subscribe Modal */}
        {showSubscribeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShowSubscribeModal(false);
                  setCopied(false);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-brand-cream rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={24} className="text-brand-black" />
              </button>

              <h3 className="text-2xl md:text-3xl font-primary font-bold text-brand-black mb-4 pr-8">
                Subscribe to {subscribeType === 'private' ? 'Private' : 'Public'} Calendar
              </h3>

              <p className="text-brand-black/80 font-secondary mb-6">
                {copied ? (
                  <span className="text-green-600 font-semibold">
                    ✓ The calendar feed URL has been copied to your clipboard and Google Calendar should be open in a new tab.
                    <br /><br />
                    <strong>Next steps:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>In the Google Calendar page, paste the URL (Ctrl+V or Cmd+V) in the &quot;URL of calendar&quot; field</li>
                      <li>Click &quot;Add calendar&quot;</li>
                      <li>The calendar will automatically sync and update when new events are added</li>
                    </ol>
                  </span>
                ) : (
                  'Google Calendar is opening in a new tab. The calendar feed URL will be copied to your clipboard.'
                )}
              </p>

              {/* Feed URL Display */}
              <div className="bg-brand-cream rounded-lg p-4 mb-6">
                <p className="text-sm text-brand-black/70 font-secondary mb-2 font-semibold">Calendar Feed URL (already copied to clipboard):</p>
                <div className="flex items-start gap-2 mb-2">
                  <code className="text-xs font-mono text-brand-black break-all flex-1 bg-white p-2 rounded border">
                    {getCalendarFeedUrl(subscribeType === 'private')}
                  </code>
                  <button
                    onClick={copyFeedUrl}
                    className="p-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-brown hover:text-white transition-colors flex items-center gap-2 flex-shrink-0"
                    title="Copy URL again"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-brand-black/60 font-secondary mt-2">
                  This calendar will automatically update when new events are added to the website.
                </p>
              </div>

              {/* Instructions */}
              <div className="flex flex-col items-center gap-4">
                <div className="bg-brand-tan/30 rounded-lg p-4 w-full">
                  <p className="text-sm text-brand-black/80 font-secondary text-center">
                    <strong>Can&apos;t find the Google Calendar page?</strong>
                    <br />
                    <a
                      href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-gold hover:text-brand-brown underline font-semibold mt-2 inline-block"
                    >
                      Click here to open Google Calendar
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
