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
  const isAdminPage = pathname?.startsWith('/admin');
  const shouldHideSidebar = pathname === '/get-involved' || isAdminPage;
  const mainPadding = shouldHideSidebar ? '' : 'lg:pl-64';
  const footerPadding = shouldHideSidebar ? '' : 'lg:ml-64';

  return (
    <>
      {!isAdminPage && <Header />}
      {!isAdminPage && <Sidebar />}
      <main className={`min-h-screen ${mainPadding} relative z-10`}>
        {children}
      </main>
      {!isAdminPage && (
        <footer className={`bg-brand-black text-white ${footerPadding}`}>
          <Footer />
        </footer>
      )}
    </>
  );
}

