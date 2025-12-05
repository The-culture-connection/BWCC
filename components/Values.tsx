'use client';

import { motion } from 'framer-motion';
import { Lightbulb, Heart, Users, Zap } from 'lucide-react';

const values = [
  {
    icon: Lightbulb,
    title: 'Creativity',
    description: 'Leads us to new ideas, originality, and forward thinking',
    bgColor: 'from-brand-cream to-brand-tan',
    iconBg: 'bg-brand-gold',
  },
  {
    icon: Heart,
    title: 'Authenticity',
    description: 'Helps us be true to our mission and values and build strong relationships within our community',
    bgColor: 'from-brand-tan to-brand-cream',
    iconBg: 'bg-brand-brown',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Creates Synergy for us to spark positive change',
    bgColor: 'from-brand-gold/20 to-brand-cream',
    iconBg: 'bg-brand-gold',
  },
  {
    icon: Zap,
    title: 'Boldness',
    description: 'Catapults our organization to embrace challenges and push forward',
    bgColor: 'from-brand-cream to-brand-gold/20',
    iconBg: 'bg-brand-brown',
  },
];

export default function Values() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-gold mb-4">
            Our Core Values
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((value) => (
            <motion.div
              key={value.title}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className={`bg-gradient-to-br ${value.bgColor} rounded-2xl p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 border border-brand-gold/20`}>
                <div className={`w-14 h-14 ${value.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <value.icon className="text-brand-black" size={28} />
                </div>
                <h3 className="text-2xl font-primary font-bold text-brand-black mb-3">
                  {value.title}
                </h3>
                <p className="text-brand-black/80 leading-relaxed font-secondary">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
