'use client';

import AdminLayout from '@/components/AdminLayout';
import SuggestionButton from '@/components/SuggestionButton';
import { useState, useEffect } from 'react';
import { getCurrentUser, changePassword } from '@/lib/firebase/auth';
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
  const [activeTab, setActiveTab] = useState<'users' | 'committees' | 'password'>('users');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // User creation form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'board' | 'staff',
  });

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile editing form
  const [profileForm, setProfileForm] = useState({
    name: '',
    role: 'staff' as 'admin' | 'board' | 'staff',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
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
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserId(user.uid);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/admin/auth/check', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });
        const data = await response.json();
        if (data.user) {
          setCurrentUserRole(data.user.role || 'staff');
          // Load current user's profile data from the response
          if (data.user.name || data.user.role) {
            setProfileForm({
              name: data.user.name || '',
              role: (data.user.role || 'staff') as 'admin' | 'board' | 'staff',
            });
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
  };

  const loadUsers = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/users?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      const loadedUsers = data.users || [];
      setUsers(loadedUsers);
      
      // Update profile form if current user is in the list
      const user = getCurrentUser();
      if (user) {
        const currentUser = loadedUsers.find((u: User) => u.uid === user.uid);
        if (currentUser) {
          setProfileForm({
            name: currentUser.name || '',
            role: currentUser.role as 'admin' | 'board' | 'staff',
          });
        }
      }
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

  const handleChangePassword = async () => {
    const user = getCurrentUser();
    if (!user) {
      setPasswordError('You must be logged in');
      return;
    }

    // Check if user signed in with email/password (not Google)
    const providers = user.providerData;
    const hasEmailProvider = providers.some(p => p.providerId === 'password');
    
    if (!hasEmailProvider) {
      setPasswordError('Password change is only available for email/password accounts. Google sign-in users cannot change password here.');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else {
        setPasswordError(error.message || 'Failed to change password');
      }
    } finally {
      setChangingPassword(false);
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
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-brand-gold text-brand-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
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

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="space-y-6">
            {/* Profile Editing Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-brand-black mb-4">Edit Your Profile</h2>
              
              {profileError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {profileSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    placeholder="Enter your name"
                  />
                </div>
                {currentUserRole === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={profileForm.role}
                      onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="staff">Staff</option>
                      <option value="board">Board</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={async () => {
                    const user = getCurrentUser();
                    if (!user) {
                      setProfileError('You must be logged in');
                      return;
                    }

                    if (!profileForm.name.trim()) {
                      setProfileError('Name is required');
                      return;
                    }

                    setProfileError('');
                    setProfileSuccess('');
                    setSavingProfile(true);

                    try {
                      const idToken = await user.getIdToken();
                      const response = await fetch(`/api/admin/users/${user.uid}`, {
                        method: 'PATCH',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                          name: profileForm.name,
                          role: currentUserRole === 'admin' ? profileForm.role : undefined,
                          idToken,
                        }),
                      });

                      if (response.ok) {
                        setProfileSuccess('Profile updated successfully!');
                        await loadUsers();
                        await loadCurrentUser();
                      } else {
                        const data = await response.json();
                        setProfileError(data.error || 'Failed to update profile');
                      }
                    } catch (error: any) {
                      console.error('Error updating profile:', error);
                      setProfileError(error.message || 'Failed to update profile');
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-brand-black mb-4">Change Your Password</h2>
              <p className="text-sm text-gray-600 mb-6">
                Only users who signed in with email/password can change their password here. 
                Google sign-in users manage their passwords through their Google account.
              </p>
              
              {passwordError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    placeholder="Enter your current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    placeholder="Enter your new password (min 6 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    placeholder="Confirm your new password"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <SuggestionButton />
    </AdminLayout>
  );
}

