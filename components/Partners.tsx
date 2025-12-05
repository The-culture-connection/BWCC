'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const partners = [
  {
    id: 1,
    name: 'Closing the Health Gap',
    logo: '/assets/closing the health gap.png',
  },
  {
    id: 2,
    name: 'Greater Cincinnati Foundation',
    logo: '/assets/Greater Cincinnati Foundation.png',
  },
  {
    id: 3,
    name: 'Interact for Health',
    logo: '/assets/Interact for health.png',
  },
  {
    id: 4,
    name: 'Mental Health and Addiction',
    logo: '/assets/mental health and addiction.png',
  },
];

export default function Partners() {
  return (
    <section id="partners" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Our Partners
          </h2>
          <p className="text-xl text-brand-black/70 font-secondary">
            Organizations working with us to create positive change
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-2xl p-8 border border-brand-cream flex items-center justify-center min-h-[200px] hover:shadow-lg transition-all duration-300"
            >
              <div className="relative w-full h-32 flex items-center justify-center">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
