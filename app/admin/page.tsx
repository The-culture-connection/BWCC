'use client';

import AdminLayout from '@/components/AdminLayout';
import SuggestionButton from '@/components/SuggestionButton';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    upcomingEvents: 0,
    totalVolunteers: 0,
    newsletterSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to load stats');
        }
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        // Keep default stats values on error
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Dashboard</h1>
          <SuggestionButton page="Dashboard" />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Requests</h3>
              <p className="text-3xl font-bold text-brand-black">{stats?.pendingRequests ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Upcoming Events</h3>
              <p className="text-3xl font-bold text-brand-black">{stats?.upcomingEvents ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total Volunteers</h3>
              <p className="text-3xl font-bold text-brand-black">{stats?.totalVolunteers ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Newsletter Subscribers</h3>
              <p className="text-3xl font-bold text-brand-black">{stats?.newsletterSubscribers ?? 0}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-brand-black mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/requests"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-brand-gold transition"
            >
              <h3 className="font-semibold text-brand-black mb-2">Review Requests</h3>
              <p className="text-sm text-gray-600">Approve or deny speaking engagements, partnerships, and more</p>
            </a>
            <a
              href="/admin/events"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-brand-gold transition"
            >
              <h3 className="font-semibold text-brand-black mb-2">Manage Events</h3>
              <p className="text-sm text-gray-600">View and update events and activities</p>
            </a>
            <a
              href="/admin/export"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-brand-gold transition"
            >
              <h3 className="font-semibold text-brand-black mb-2">Export Data</h3>
              <p className="text-sm text-gray-600">Download newsletters, volunteers, and more as CSV</p>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

