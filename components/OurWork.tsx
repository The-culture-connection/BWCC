'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FileText, TrendingUp, Heart, Users } from 'lucide-react';

const projects = [
  {
    id: 7,
    image: '/assets/7.png',
    title: 'Mental Health Education',
    description: 'Providing comprehensive mental health education and awareness programs for the Black Community.',
  },
  {
    id: 8,
    image: '/assets/8.png',
    title: 'Community Workshops',
    description: 'Hosting workshops and training sessions to empower individuals with mental wellness tools and resources.',
  },
  {
    id: 9,
    image: '/assets/9.png',
    title: 'Advocacy Programs',
    description: 'Advocating for accessible and equitable mental health services across our community.',
  },
  {
    id: 10,
    image: '/assets/10.png',
    title: 'Support Platforms',
    description: 'Creating safe spaces and platforms for open dialogue about mental health and wellness.',
  },
];

const areasOfFocus = [
  {
    icon: Heart,
    title: 'Mental Health & Wellness',
    description: 'Eliminating stigmas and creating accessible mental health resources for the Black Community.',
  },
  {
    icon: Users,
    title: 'Community Engagement',
    description: 'Building strong relationships and fostering connections within our community through active participation.',
  },
  {
    icon: TrendingUp,
    title: 'Education & Advocacy',
    description: 'Providing educational platforms and advocating for equitable mental health services and policies.',
  },
  {
    icon: Heart,
    title: 'Support & Empowerment',
    description: 'Creating safe spaces where individuals can seek support and feel empowered to prioritize their wellness.',
  },
];


const empoweringChange = [
  {
    stat: '500+',
    label: 'Community Members Served',
    description: 'Individuals who have participated in our programs and workshops',
  },
  {
    stat: '50+',
    label: 'Workshops Hosted',
    description: 'Educational and wellness workshops conducted throughout the year',
  },
  {
    stat: '15+',
    label: 'Community Partnerships',
    description: 'Organizations collaborating with us to create positive change',
  },
  {
    stat: '100%',
    label: 'Dedicated to Change',
    description: 'Committed to eliminating mental health stigmas in the Black Community',
  },
];

export default function OurWork() {
  return (
    <section id="our-work" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Our Work
          </h2>
          <p className="text-xl text-brand-black/70 font-secondary max-w-3xl mx-auto">
            We are committed to creating lasting change through education, advocacy, and community support programs.
          </p>
        </motion.div>

        {/* Projects Side by Side */}
        <div className="space-y-12 mb-20">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
            >
              {/* Image */}
              <div className="flex-1 w-full">
                <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg border border-brand-cream">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 w-full">
                <div className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-8 md:p-12 shadow-lg border border-brand-gold/30 h-full flex flex-col justify-center">
                  <h3 className="text-3xl md:text-4xl font-primary font-bold text-brand-black mb-6">
                    {project.title}
                  </h3>
                  <p className="text-lg text-brand-black/90 leading-relaxed font-secondary">
                    {project.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Areas of Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-3xl md:text-4xl font-primary font-bold text-brand-black text-center mb-12">
            Areas of Focus
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {areasOfFocus.map((area, index) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-6 shadow-lg border border-brand-gold/30 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-brand-gold rounded-xl flex items-center justify-center mb-4">
                  <area.icon className="text-brand-black" size={24} />
                </div>
                <h4 className="text-xl font-primary font-bold text-brand-black mb-3">
                  {area.title}
                </h4>
                <p className="text-brand-black/80 leading-relaxed font-secondary text-sm">
                  {area.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Empowering Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-gradient-to-br from-brand-cream/50 to-brand-tan/50 rounded-2xl p-8 md:p-12 border border-brand-gold/30">
            <div className="flex flex-col items-center mb-12">
              <h3 className="text-3xl md:text-4xl font-primary font-bold text-brand-black text-center mb-6">
                Empowering Change
              </h3>
              <a
                href="https://drive.google.com/drive/folders/1RYf6CD-P_voA9kEqA9Djcf1BTRXCDYId"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-brand-gold text-brand-black px-6 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-semibold font-secondary"
              >
                <FileText size={20} />
                <span>View 2024 Annual Report</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {empoweringChange.map((change, index) => (
                <motion.div
                  key={change.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl md:text-6xl font-primary font-bold text-brand-gold mb-3">
                    {change.stat}
                  </div>
                  <h4 className="text-xl font-primary font-bold text-brand-black mb-2">
                    {change.label}
                  </h4>
                  <p className="text-brand-black/70 font-secondary text-sm">
                    {change.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Board Meeting Minutes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-8 md:p-12 border border-brand-gold/30 text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <FileText className="text-brand-gold" size={32} />
              <h3 className="text-3xl md:text-4xl font-primary font-bold text-brand-black">
                Board Meeting Minutes
              </h3>
            </div>
            <p className="text-lg text-brand-black/80 font-secondary mb-8 max-w-2xl mx-auto">
              Access our board meeting minutes and stay informed about our organizational decisions and initiatives.
            </p>
            <a
              href="https://drive.google.com/drive/folders/1jtyOarLGLJS0hB_0LCei12HmddC2vTbi?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-brand-gold text-brand-black px-8 py-4 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-semibold font-secondary text-lg"
            >
              <FileText size={24} />
              <span>View All Board Meeting Minutes</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
