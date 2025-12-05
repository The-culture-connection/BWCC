'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Contact Us
          </h2>
          <p className="text-xl text-brand-black/70 font-secondary max-w-2xl mx-auto">
            Get in touch with us. We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-brand-cream to-brand-tan rounded-2xl p-6 border border-brand-gold/30">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center">
                  <Mail className="text-brand-black" size={24} />
                </div>
                <div>
                  <h3 className="font-primary font-bold text-brand-black text-lg">Email</h3>
                  <p className="text-brand-black/80 font-secondary">info@blackwomencultivatingchange.com</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-brand-cream">
              <div className="mb-6">
                <label className="block text-brand-black font-secondary font-semibold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
                />
              </div>

              <div className="mb-6">
                <label className="block text-brand-black font-secondary font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
                />
              </div>

              <div className="mb-6">
                <label className="block text-brand-black font-secondary font-semibold mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none font-secondary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold text-brand-black py-4 rounded-lg font-primary font-bold text-lg hover:bg-brand-brown hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

