'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useScroll, useTransform, motion } from 'framer-motion';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const shouldHideSidebar = pathname === '/get-involved';
  const navPadding = shouldHideSidebar ? 'lg:px-8' : 'lg:px-8 lg:pl-80';
  
  // Transform values that change with scroll - shrinks from 140px to 80px over first 150px of scroll
  const headerHeight = useTransform(scrollY, [0, 150], [140, 80]);
  const logoSize = useTransform(scrollY, [0, 150], [120, 64]);
  const textSize = useTransform(scrollY, [0, 150], [48, 24]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'shadow-md'
          : ''
      }`}
      style={{ 
        height: headerHeight,
        backgroundColor: '#d4a16b'
      }}
    >
      <nav className={`container mx-auto px-4 sm:px-6 ${navPadding} h-full`}>
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4">
            <motion.div 
              className="relative flex items-center justify-center"
              style={{ 
                width: logoSize, 
                height: logoSize 
              }}
            >
              <Image
                src="/assets/Logo.png"
                alt="BWCC Logo"
                width={120}
                height={120}
                className="object-contain w-full h-full"
                priority
                unoptimized
              />
            </motion.div>
            <motion.span 
              className="hidden sm:block font-primary font-bold text-brand-black"
              style={{ fontSize: textSize }}
            >
              Black Women Cultivating Change
            </motion.span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-brand-black hover:text-brand-brown font-medium transition-colors duration-200 font-secondary"
            >
              Home
            </Link>
            <Link
              href="/get-involved"
              className="text-brand-black hover:text-brand-brown font-medium transition-colors duration-200 font-secondary"
            >
              Get Involved
            </Link>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
