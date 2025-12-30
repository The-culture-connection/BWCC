'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/firebase/auth';
import { Committee } from '@/lib/types/database';

interface User {
  uid: string;
  email: string;
  name?: string;
  role: string;
}

export default function AdminManagePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'committees'>('users');
  
  // User creation form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'board' | 'staff',
  });

  // Committee creation form
  const [newCommittee, setNewCommittee] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadUsers();
    loadCommittees();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommittees = async () => {
    try {
      const response = await fetch('/api/admin/committees');
      const data = await response.json();
      setCommittees(data.committees || []);
    } catch (error) {
      console.error('Error loading committees:', error);
    }
  };

  const handleCreateUser = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in');
      return;
    }

    if (!newUser.email || !newUser.password) {
      alert('Email and password are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert('User created successfully');
        setNewUser({ name: '', email: '', password: '', role: 'staff' });
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    }
  };

  const handleCreateCommittee = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in');
      return;
    }

    if (!newCommittee.name.trim()) {
      alert('Committee name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCommittee,
          createdBy: user.uid,
        }),
      });

      if (response.ok) {
        alert('Committee created successfully');
        setNewCommittee({ name: '', description: '' });
        loadCommittees();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create committee');
      }
    } catch (error) {
      console.error('Error creating committee:', error);
      alert('Error creating committee');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-black mb-8">Admin Management</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-brand-gold text-brand-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('committees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'committees'
                  ? 'border-brand-gold text-brand-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Committees
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-brand-black mb-4">Create New User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="staff">Staff</option>
                    <option value="board">Board</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
                >
                  Create User
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-bold text-brand-black p-6 border-b">Existing Users</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  </tr>
                </thead>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Committees Tab */}
        {activeTab === 'committees' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-brand-black mb-4">Create New Committee</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Committee Name *
                  </label>
                  <input
                    type="text"
                    value={newCommittee.name}
                    onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCommittee.description}
                    onChange={(e) => setNewCommittee({ ...newCommittee, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleCreateCommittee}
                  className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
                >
                  Create Committee
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-bold text-brand-black p-6 border-b">Existing Committees</h2>
              <div className="divide-y divide-gray-200">
                {committees.length === 0 ? (
                  <p className="p-6 text-gray-500">No committees yet</p>
                ) : (
                  committees.map((committee) => (
                    <div key={committee.id} className="p-6">
                      <h3 className="font-semibold text-brand-black">{committee.name}</h3>
                      {committee.description && (
                        <p className="text-sm text-gray-600 mt-1">{committee.description}</p>
                      )}
                      {committee.members && committee.members.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {committee.members.length} member{committee.members.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

