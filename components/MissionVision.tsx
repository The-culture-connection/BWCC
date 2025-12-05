'use client';

import { motion } from 'framer-motion';
import { Target, Eye } from 'lucide-react';

export default function MissionVision() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Mission */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-8 shadow-lg border border-brand-gold/30"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-brand-gold rounded-xl flex items-center justify-center">
                <Target className="text-brand-black" size={24} />
              </div>
              <h2 className="text-3xl font-primary font-bold text-brand-black">Mission</h2>
            </div>
            <p className="text-lg text-brand-black/90 leading-relaxed font-secondary">
              Black Women Cultivating Change (BWCC) is a 501(c)(3) that advocates, educates, and provides platforms to eliminate the stigmas associated with mental health in the Black Community.
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-brand-tan to-brand-cream rounded-2xl p-8 shadow-lg border border-brand-gold/30"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-brand-brown rounded-xl flex items-center justify-center">
                <Eye className="text-white" size={24} />
              </div>
              <h2 className="text-3xl font-primary font-bold text-brand-black">Vision</h2>
            </div>
            <p className="text-lg text-brand-black/90 leading-relaxed font-secondary">
              To create environments, where Mental Health and Wellness is accessible and equitable for the Black Community as a whole.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
