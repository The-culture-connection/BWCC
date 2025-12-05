'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '#meet-founder', label: 'Meet the Founder' },
  { href: '#board-members', label: 'Board Members' },
  { href: '#our-work', label: 'Our Work' },
  { href: '/get-involved', label: 'Get Involved' },
  { href: '#annual-summit', label: 'Annual Summit' },
  { href: '#events', label: 'Events' },
  { href: '#contact', label: 'Contact Us' },
  { href: '#donate', label: 'Donate' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // Hide sidebar on Get Involved page
  const shouldHideSidebar = pathname === '/get-involved';

  useEffect(() => {
    const handleScroll = () => {
      // Close sidebar on scroll for mobile
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (shouldHideSidebar) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside 
        className="hidden lg:flex fixed left-0 top-48 bottom-0 w-64 z-40"
      >
        <div className="w-full bg-black/10 backdrop-blur-md h-full">
          <nav className="p-8 pt-4 space-y-4">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={link.href}
                  className="block text-white hover:text-brand-gold transition-colors duration-200 font-secondary font-medium py-2 px-4 rounded-lg hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
      </motion.aside>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed left-4 top-24 z-50 bg-brand-gold text-brand-black p-3 rounded-full shadow-lg hover:bg-brand-brown hover:text-white transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 bg-black/90 backdrop-blur-sm shadow-2xl"
            >
              <nav className="p-8 pt-24 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-white hover:text-brand-gold transition-colors duration-200 font-secondary font-medium py-2 px-4 rounded-lg hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

