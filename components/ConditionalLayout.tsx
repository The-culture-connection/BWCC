'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const shouldHideSidebar = pathname === '/get-involved';
  const mainPadding = shouldHideSidebar ? '' : 'lg:pl-64';
  const footerPadding = shouldHideSidebar ? '' : 'lg:ml-64';

  return (
    <>
      <Header />
      <Sidebar />
      <main className={`min-h-screen ${mainPadding} relative z-10`}>
        {children}
      </main>
      <footer className={`bg-brand-black text-white ${footerPadding}`}>
        <Footer />
      </footer>
    </>
  );
}

