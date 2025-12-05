'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export default function MeetFounder() {
  const youtubeVideoId = 'yZihXBl9buw';
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeVideoId}`;

  return (
    <section id="meet-founder" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Meet the Founder
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Video Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-6 shadow-lg border border-brand-gold/30 overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={youtubeEmbedUrl}
                  title="Meet the Founder - Ashley"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                />
              </div>
            </div>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-8 md:p-12 shadow-lg border border-brand-gold/30">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center border-4 border-brand-brown">
                  <User className="text-brand-black" size={32} />
                </div>
                <h3 className="text-3xl font-primary font-bold text-brand-black">About Me</h3>
              </div>
              
              <div className="space-y-6">
                <p className="text-lg text-brand-black/90 leading-relaxed font-secondary">
                  Ashley is a mother of 3 beautiful girls and considers herself a <strong className="text-brand-brown">Health Equity Catalyst and Creative</strong>. Ashley has a deep love for leveraging resources and advocating for Mental and Maternal Health Services for the Black Community.
                </p>
                
                <p className="text-lg text-brand-black/90 leading-relaxed font-secondary">
                  Ashley&apos;s natural gift is critically thinking and connecting and elevating individuals who are able to relate and empower individuals in the community to navigate our complex healthcare system.
                </p>
                
                <div className="pt-4 border-t border-brand-gold/30">
                  <p className="text-xl font-primary font-semibold text-brand-brown italic">
                    &quot;Life is Not Surface Level&quot;
                  </p>
                  <p className="text-sm text-brand-black/70 font-secondary mt-2">
                    - Ashley&apos;s signature quote
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
