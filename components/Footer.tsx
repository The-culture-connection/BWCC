import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image
                  src="/assets/Logo.png"
                  alt="BWCC Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="font-primary font-bold text-lg">BWCC</span>
            </div>
            <p className="text-gray-400 text-sm font-secondary">
              Advocating, educating, and providing platforms to eliminate mental health stigmas in the Black Community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-primary font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#meet-founder" className="text-gray-400 hover:text-brand-gold transition-colors font-secondary">
                  Meet the Founder
                </Link>
              </li>
              <li>
                <Link href="#our-work" className="text-gray-400 hover:text-brand-gold transition-colors font-secondary">
                  Our Work
                </Link>
              </li>
              <li>
                <Link href="#annual-summit" className="text-gray-400 hover:text-brand-gold transition-colors font-secondary">
                  Annual Summit
                </Link>
              </li>
              <li>
                <Link href="#events" className="text-gray-400 hover:text-brand-gold transition-colors font-secondary">
                  Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-primary font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/blackwomencultivatingchange/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-black transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.facebook.com/BWCCCincy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-black transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/black-women-cultivating-change"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-black transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm font-secondary">
          <p>&copy; {new Date().getFullYear()} Black Women Cultivating Change. All rights reserved.</p>
          <p className="mt-2">A 501(c)(3) Non-Profit Organization</p>
        </div>
      </div>
    </>
  );
}
