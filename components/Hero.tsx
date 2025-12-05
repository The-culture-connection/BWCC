'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Thank you for subscribing!');
        setName('');
        setEmail('');
        // Redirect to Get Involved page after 1.5 seconds
        setTimeout(() => {
          router.push('/get-involved');
        }, 1500);
      } else {
        setMessage(data.error || `Error: ${response.status} - Something went wrong. Please try again.`);
        console.error('API Error:', data);
      }
    } catch (error: any) {
      setMessage(`An error occurred: ${error.message || 'Please try again.'}`);
      console.error('Newsletter subscription error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="container mx-auto max-w-2xl flex flex-col items-center">
        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-cream">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-primary font-bold text-brand-gold mb-4">
                Stay Connected
              </h1>
              <p className="text-lg text-brand-black font-secondary">
                Join our newsletter for the most up to date and direct communication
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-gold text-brand-black px-6 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-semibold flex items-center justify-center gap-2 font-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                  {!isSubmitting && <ArrowRight size={20} />}
                </button>
              </div>
              {message && (
                <p className={`text-sm font-secondary text-center ${
                  message.includes('Thank you') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
