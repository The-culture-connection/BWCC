'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users, Award, User } from 'lucide-react';

const boardMembers = [
  {
    name: 'Dr. Corinn Taylor',
    role: 'Chair',
    image: '/assets/Dr Corinn.png',
  },
  {
    name: 'Sonya Wells',
    role: 'Vice Chair',
    image: '/assets/Sonya Wells.png',
  },
  {
    name: 'Clarice Warner',
    role: 'Policy and Advocacy Committee Lead',
    image: '/assets/Clarice Warner.png',
  },
  {
    name: 'Rashida Pearson',
    role: 'General Member',
    image: '/assets/Rashida Pearson.png',
  },
  {
    name: 'Dr. Lisa Newton',
    role: 'General Member',
    image: '/assets/Dr Lisa Newton.png',
  },
  {
    name: 'Dr. Ebony Griggs Griffin',
    role: 'General Member',
    image: '/assets/Dr Ebony Griggs Griffin.png',
  },
  {
    name: "De'Asia Thompson, LISW",
    role: 'General Member',
    image: "/assets/De'Asia Thompson.png",
  },
];

export default function BoardMembers() {
  const getRoleIcon = (role: string) => {
    if (role.includes('Chair')) return Award;
    return User;
  };

  return (
    <section id="board-members" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Users className="text-brand-gold" size={40} />
            <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black">
              Board Members
            </h2>
          </div>
          <p className="text-xl text-brand-black/70 font-secondary max-w-3xl mx-auto">
            Dedication. Expertise. Passion.
          </p>
          <p className="text-lg text-brand-black/60 font-secondary mt-4 max-w-2xl mx-auto">
            Meet the dedicated individuals leading Black Women Cultivating Change forward.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {boardMembers.map((member, index) => {
            const RoleIcon = getRoleIcon(member.role);
            return (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-brand-cream hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative w-full h-64 bg-gradient-to-br from-brand-cream to-brand-tan">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <RoleIcon className="text-brand-gold" size={18} />
                    <span className="text-xs font-secondary font-semibold text-brand-brown uppercase tracking-wide">
                      {member.role}
                    </span>
                  </div>
                  <h3 className="text-xl font-primary font-bold text-brand-black">
                    {member.name}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

