'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, Handshake, Users, MessageSquare, UserCheck, Heart, GraduationCap, Share2 } from 'lucide-react';
import DynamicForm from './DynamicForm';

const involvementTypes = [
  { id: 'speak', label: 'Book Us to Speak', icon: Mic, color: 'bg-brand-gold' },
  { id: 'partner', label: 'Partner With Us', icon: Handshake, color: 'bg-brand-brown' },
  { id: 'listening', label: 'Host a Community Listening Session / Focus Group', icon: Users, color: 'bg-[#a56c30]' },
  { id: 'panelist', label: 'Apply to Be a Panelist', icon: UserCheck, color: 'bg-[#d1a270]' },
  { id: 'volunteer', label: 'Volunteer With Us', icon: Heart, color: 'bg-brand-gold' },
  { id: 'training', label: 'Sign Up for Trainings', icon: GraduationCap, color: 'bg-brand-brown' },
  { id: 'share', label: 'Share an Opportunity / Resource', icon: Share2, color: 'bg-[#d1a270]' },
  { id: 'panel-topic', label: 'Suggest a Saturday Panel Topic', icon: MessageSquare, color: 'bg-brand-gold' },
];

export default function GetInvolved() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <section id="get-involved" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {!selectedType ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-gold mb-4">
                Get Involved
              </h2>
              <p className="text-xl text-brand-black/80 font-secondary max-w-2xl mx-auto">
                Choose how you&apos;d like to get involved with Black Women Cultivating Change
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {involvementTypes.map((type, index) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedType(type.id)}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-brand-cream hover:shadow-xl transition-all duration-300 text-left group"
                >
                  <div className={`w-14 h-14 ${type.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                    <type.icon className="text-white" size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-primary font-bold text-brand-black mb-2">
                    {type.label}
                  </h3>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-brand-cream mt-32"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-primary font-bold text-brand-black">
                {involvementTypes.find(t => t.id === selectedType)?.label}
              </h2>
              <button
                onClick={() => setSelectedType(null)}
                className="p-2 hover:bg-brand-cream rounded-lg transition-colors"
                aria-label="Close form"
              >
                <X size={24} className="text-brand-black" />
              </button>
            </div>
            <DynamicForm type={selectedType} onSuccess={() => setSelectedType(null)} />
          </motion.div>
        )}
      </div>
    </section>
  );
}

