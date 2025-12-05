'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Lock, Unlock, ChevronLeft, ChevronRight, X, Copy, Check } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isValid } from 'date-fns';

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
  const [showPrivate, setShowPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeType, setSubscribeType] = useState<'public' | 'private'>('public');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchEvents(false);
  }, []);

  const fetchEvents = async (includePrivate: boolean) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/events?private=${includePrivate}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'BWCC2025') {
      setIsAuthenticated(true);
      setPasswordError(false);
      fetchEvents(true);
    } else {
      setPasswordError(true);
      setPassword('');
    }
  };

  const togglePrivateView = () => {
    if (!showPrivate && !isAuthenticated) {
      return;
    }
    const newShowPrivate = !showPrivate;
    setShowPrivate(newShowPrivate);
    fetchEvents(newShowPrivate && isAuthenticated);
  };

  const getCalendarFeedUrl = (includePrivate: boolean = false): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (includePrivate && isAuthenticated) {
      return `${baseUrl}/api/calendar/feed?private=true&password=BWCC2025`;
    }
    return `${baseUrl}/api/calendar/feed`;
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

  const handleDirectSubscribe = (type: 'public' | 'private') => {
    const url = getCalendarFeedUrl(type === 'private');
    
    // Try multiple methods to make it as automatic as possible
    // Method 1: Use webcal:// protocol for desktop calendar apps
    try {
      const webcalUrl = url.replace(/^https?:\/\//, 'webcal://');
      window.location.href = webcalUrl;
      
      // If webcal doesn't work (e.g., on Google Calendar web), fall back after a short delay
      setTimeout(() => {
        handleGoogleCalendarSubscribe(type);
      }, 500);
    } catch (err) {
      // Fallback to Google Calendar method
      handleGoogleCalendarSubscribe(type);
    }
  };

  const handleGoogleCalendarSubscribe = async (type: 'public' | 'private') => {
    const url = getCalendarFeedUrl(type === 'private');
    
    // Open modal first
    setSubscribeType(type);
    setShowSubscribeModal(true);
    
    // Try to auto-copy URL
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
    
    // Open Google Calendar "Add by URL" page
    // The cid parameter method doesn't work reliably, so we use the direct addbyurl page
    window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank');
  };

  const handleAddToGoogleCalendar = (type: 'public' | 'private') => {
    const url = getCalendarFeedUrl(type === 'private');
    
    // Try multiple Google Calendar subscription methods
    // Method 1: Direct URL subscription (most reliable)
    const directUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(url)}`;
    
    // Method 2: If URL has query params, we might need to handle it differently
    // Convert http/https to webcal for better compatibility
    const webcalUrl = url.replace(/^https?:\/\//, 'webcal://');
    const googleCalendarWebcal = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;
    
    // Try the direct method first
    const newWindow = window.open(directUrl, '_blank');
    
    // If popup is blocked or fails, try webcal version
    setTimeout(() => {
      if (!newWindow || newWindow.closed) {
        window.open(googleCalendarWebcal, '_blank');
      }
    }, 500);
    
    // Fallback: Open addbyurl page
    setTimeout(() => {
      if (!newWindow || newWindow.closed) {
        window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank');
      }
    }, 1500);
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
          
          {/* Subscribe Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => handleDirectSubscribe('public')}
              className="bg-brand-gold text-brand-black px-6 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-secondary font-semibold flex items-center gap-2"
            >
              <Calendar size={20} />
              Subscribe to Public Calendar
            </button>
            {isAuthenticated && (
              <button
                onClick={() => handleDirectSubscribe('private')}
                className="bg-brand-brown text-white px-6 py-3 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-colors font-secondary font-semibold flex items-center gap-2"
              >
                <Calendar size={20} />
                Subscribe to Private Calendar
              </button>
            )}
          </div>
        </motion.div>

        {/* Private Calendar Toggle */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <form onSubmit={handlePasswordSubmit} className="flex items-center gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter password for private events"
                  className="px-4 py-2 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold font-secondary"
                />
                <button
                  type="submit"
                  className="bg-brand-gold text-brand-black px-4 py-2 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-secondary font-semibold flex items-center gap-2"
                >
                  <Lock size={18} />
                  Unlock Private
                </button>
              </form>
            ) : (
              <button
                onClick={togglePrivateView}
                className={`px-4 py-2 rounded-lg transition-colors font-secondary font-semibold flex items-center gap-2 ${
                  showPrivate
                    ? 'bg-brand-brown text-white'
                    : 'bg-brand-cream text-brand-black hover:bg-brand-tan'
                }`}
              >
                {showPrivate ? <Unlock size={18} /> : <Lock size={18} />}
                {showPrivate ? 'Showing Private Events' : 'Show Private Events'}
              </button>
            )}
            {passwordError && (
              <span className="text-red-600 font-secondary text-sm">
                Incorrect password
              </span>
            )}
          </div>
        </div>

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
                    ✓ Google Calendar should be open in a new tab. If you see a subscription prompt, click &quot;Add&quot; or &quot;Subscribe&quot;.
                    <br /><br />
                    If not, the calendar URL is copied - just paste it (Ctrl+V or Cmd+V) in the Google Calendar subscription page.
                  </span>
                ) : (
                  'Google Calendar is opening in a new tab. If prompted, click &quot;Add&quot; to subscribe to the calendar.'
                )}
              </p>

              {/* Feed URL Display */}
              <div className="bg-brand-cream rounded-lg p-4 mb-6">
                <p className="text-sm text-brand-black/70 font-secondary mb-2">Calendar Feed URL:</p>
                <div className="flex items-start gap-2 mb-2">
                  <code className="text-xs font-mono text-brand-black break-all flex-1">
                    {getCalendarFeedUrl(subscribeType === 'private')}
                  </code>
                  <button
                    onClick={copyFeedUrl}
                    className="p-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-brown hover:text-white transition-colors flex items-center gap-2 flex-shrink-0"
                    title="Copy URL"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Big Add Button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => {
                    // Open the "Add calendar by URL" page - most reliable method
                    // Google Calendar's cid parameter doesn't work reliably with custom feeds
                    window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank');
                  }}
                  className="bg-brand-gold text-brand-black px-8 py-4 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-secondary font-bold text-lg flex items-center gap-2 shadow-lg"
                >
                  <Calendar size={24} />
                  Open Google Calendar
                </button>
                <p className="text-sm text-brand-black/60 font-secondary text-center max-w-md">
                  Click the button above to open Google Calendar. 
                  <br />
                  The URL is already copied! Just press <kbd className="px-1.5 py-0.5 bg-brand-cream rounded text-xs">Ctrl+V</kbd> (or <kbd className="px-1.5 py-0.5 bg-brand-cream rounded text-xs">Cmd+V</kbd> on Mac) in the &quot;URL of calendar&quot; field, then click &quot;Add calendar&quot;.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
