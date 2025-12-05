'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState } from 'react';

export default function Donate() {
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly' | 'yearly'>('one-time');
  const [amount, setAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState('');
  const [comment, setComment] = useState('');

  const amountOptions = [20, 50, 100, 250, 500, 1000];
  const frequencyOptions = [
    { value: 'one-time', label: 'One time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    console.log('Donation:', { frequency, amount: finalAmount, comment });
    alert(`Thank you for your ${frequency} donation of $${finalAmount}!`);
  };

  return (
    <section id="donate" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-gold rounded-full mb-6">
            <Heart className="text-brand-black" size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-primary font-bold text-brand-black mb-4">
            Make a donation
          </h2>
          <p className="text-xl text-brand-black/80 max-w-2xl mx-auto font-secondary">
            Your support helps us advocate, educate, and provide platforms to eliminate mental health stigmas in the Black Community.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-brand-cream">
            {/* Frequency Selection */}
            <div className="mb-8">
              <label className="block text-lg font-primary font-semibold text-brand-black mb-4">
                Frequency
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value as any)}
                    className={`px-4 py-3 rounded-lg font-secondary font-medium transition-all duration-200 ${
                      frequency === option.value
                        ? 'bg-brand-gold text-brand-black shadow-md'
                        : 'bg-brand-cream text-brand-black hover:bg-brand-tan'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Selection */}
            <div className="mb-8">
              <label className="block text-lg font-primary font-semibold text-brand-black mb-4">
                Amount
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {amountOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAmount(value);
                      setCustomAmount('');
                    }}
                    className={`px-4 py-3 rounded-lg font-secondary font-semibold transition-all duration-200 ${
                      amount === value && !customAmount
                        ? 'bg-brand-gold text-brand-black shadow-md'
                        : 'bg-brand-cream text-brand-black hover:bg-brand-tan'
                    }`}
                  >
                    ${value}
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Other amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) setAmount(0);
                  }}
                  className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="mb-8">
              <label className="block text-lg font-primary font-semibold text-brand-black mb-4">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share a message with your donation..."
                rows={4}
                maxLength={100}
                className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none font-secondary"
              />
              <p className="text-sm text-brand-black/60 mt-2 font-secondary">{comment.length}/100</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-brand-gold text-brand-black py-4 rounded-lg font-primary font-bold text-lg hover:bg-brand-brown hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Donate ${customAmount || amount}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
