'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';

export default function Events() {
  const events = [
    {
      title: 'Community Workshop',
      date: 'TBA',
      location: 'Virtual',
      description: 'Join us for an empowering workshop focused on mental wellness.',
    },
    {
      title: 'Networking Event',
      date: 'TBA',
      location: 'TBA',
      description: 'Connect with like-minded individuals and advocates for change.',
    },
  ];

  return (
    <section id="events" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Events
          </h2>
          <p className="text-xl text-brand-black/70 font-secondary max-w-2xl mx-auto">
            Join us for upcoming events and workshops
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-8 shadow-lg border border-brand-gold/30 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-brand-black" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-primary font-bold text-brand-black mb-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-brand-black/70 font-secondary mb-2">
                    <MapPin size={16} className="mr-2" />
                    {event.location}
                  </div>
                  <p className="text-brand-black/70 font-secondary">
                    {event.date}
                  </p>
                </div>
              </div>
              <p className="text-brand-black/80 font-secondary leading-relaxed">
                {event.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

