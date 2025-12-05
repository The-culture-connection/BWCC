'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function AnnualSummit() {
  return (
    <section id="annual-summit" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Annual Summit
          </h2>
          <p className="text-xl text-brand-black/70 font-secondary max-w-2xl mx-auto">
            Join us for our annual gathering focused on mental health and wellness in the Black Community
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-brand-cream"
        >
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-brand-gold rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="text-brand-black" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-primary font-bold text-brand-black mb-4">
                Annual Summit Information
              </h3>
              <p className="text-lg text-brand-black/80 leading-relaxed font-secondary mb-6">
                [Annual Summit details to be added]
              </p>
              <button className="bg-brand-gold text-brand-black px-8 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-semibold font-secondary">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

