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

  const openSubscribeModal = async (type: 'public' | 'private') => {
    setSubscribeType(type);
    setShowSubscribeModal(true);
    
    // Auto-copy the feed URL to clipboard
    const url = getCalendarFeedUrl(type === 'private');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      
      // Try to open Google Calendar subscription page
      // This will open in a new tab
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(url)}`;
      window.open(googleCalendarUrl, '_blank');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
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
          
          {/* Subscribe Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => openSubscribeModal('public')}
              className="bg-brand-gold text-brand-black px-6 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-secondary font-semibold flex items-center gap-2"
            >
              <Calendar size={20} />
              Subscribe to Public Calendar
            </button>
            {isAuthenticated && (
              <button
                onClick={() => openSubscribeModal('private')}
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
                  <span className="text-green-600 font-semibold">✓ URL copied to clipboard! Google Calendar should open in a new tab.</span>
                ) : (
                  'Copy the calendar feed URL below and paste it into your calendar app to automatically receive event updates.'
                )}
              </p>

              {/* Feed URL Display */}
              <div className="bg-brand-cream rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2 mb-2">
                  <code className="text-sm font-mono text-brand-black break-all flex-1">
                    {getCalendarFeedUrl(subscribeType === 'private')}
                  </code>
                  <button
                    onClick={copyFeedUrl}
                    className="p-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-brown hover:text-white transition-colors flex items-center gap-2 flex-shrink-0"
                    title="Copy URL"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600 font-secondary">URL copied to clipboard!</p>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-secondary font-semibold text-brand-black mb-2">Google Calendar:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-brand-black/80 font-secondary text-sm ml-2">
                    <li>Open Google Calendar on your computer</li>
                    <li>Click the <strong>+</strong> next to &quot;Other calendars&quot;</li>
                    <li>Select <strong>&quot;From URL&quot;</strong></li>
                    <li>Paste the URL above and click <strong>&quot;Add calendar&quot;</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-secondary font-semibold text-brand-black mb-2">Apple Calendar:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-brand-black/80 font-secondary text-sm ml-2">
                    <li>Open Calendar app on your Mac or iPhone</li>
                    <li>Go to <strong>File → New Calendar Subscription</strong> (Mac) or <strong>Settings → Calendar → Add Account → Other → Add Subscribed Calendar</strong> (iPhone)</li>
                    <li>Paste the URL above</li>
                    <li>Click <strong>&quot;Subscribe&quot;</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-secondary font-semibold text-brand-black mb-2">Outlook:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-brand-black/80 font-secondary text-sm ml-2">
                    <li>Open Outlook Calendar</li>
                    <li>Go to <strong>File → Account Settings → Internet Calendars</strong></li>
                    <li>Click <strong>&quot;New&quot;</strong> and paste the URL above</li>
                    <li>Click <strong>&quot;Add&quot;</strong></li>
                  </ol>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
