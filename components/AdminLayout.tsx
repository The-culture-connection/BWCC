'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, signOut } from '@/lib/firebase/auth';
import { User } from 'firebase/auth';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Verify user role
        try {
          const idToken = await authUser.getIdToken();
          if (idToken) {
            const response = await fetch('/api/admin/auth/check', {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (response.ok) {
              const data = await response.json();
              setUserRole(data.user?.role || null);
              setLoading(false);
            } else {
              // User not in database or not authorized
              console.error('User not found in database or not authorized');
              setLoading(false);
              router.push('/admin/login');
              return;
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand-black">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-brand-black text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">BWCC Workspace</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
        </div>
        
        <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-800">
            Dashboard
          </Link>
          <Link href="/admin/requests" className="block px-4 py-2 rounded hover:bg-gray-800">
            Requests
          </Link>
          <Link href="/admin/events" className="block px-4 py-2 rounded hover:bg-gray-800">
            Events
          </Link>
          <Link href="/admin/people" className="block px-4 py-2 rounded hover:bg-gray-800">
            People & Partners
          </Link>
          <Link href="/admin/tasks" className="block px-4 py-2 rounded hover:bg-gray-800">
            Tasks
          </Link>
          <Link href="/admin/committees" className="block px-4 py-2 rounded hover:bg-gray-800">
            Committees
          </Link>
          <Link href="/admin/schedules" className="block px-4 py-2 rounded hover:bg-gray-800">
            Schedules
          </Link>
          <Link href="/admin/manage" className="block px-4 py-2 rounded hover:bg-gray-800">
            Admin
          </Link>
        </nav>

        <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
          <div className="mb-2 text-sm text-gray-400">
            {user.email}
          </div>
          {userRole && (
            <div className="mb-4 text-xs text-gray-500 uppercase">
              {userRole}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-brand-gold text-brand-black rounded hover:bg-brand-tan"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

