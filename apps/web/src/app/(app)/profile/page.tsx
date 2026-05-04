'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { User, Mail, Globe, Edit2, Save, LogOut, Loader } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchMe } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requestedRole, setRequestedRole] = useState('tournament_organizer');
  const [requestingRole, setRequestingRole] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    region: user?.region || '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (!token) router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({ displayName: user.displayName || '', region: user.region || '' });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-neon-red animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.patch('/auth/me', formData);
      await fetchMe();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleRoleRequest = async () => {
    try {
      setRequestingRole(true);
      await apiClient.post('/auth/roles/request', { roleCode: requestedRole });
      alert('Role request submitted. Waiting for Super Admin approval.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit role request');
    } finally {
      setRequestingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-orbitron font-black text-white mb-2">
            <span className="neon-text">Profile</span>
          </h1>
          <p className="text-white/60">Manage your account and settings</p>
        </div>

        {/* Profile Card */}
        <GlassCard className="p-8 mb-6">
          {/* Avatar */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-neon-red/20 border border-neon-red/30 flex items-center justify-center font-orbitron font-black text-neon-red text-2xl">
                {user.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold text-white">{user.displayName}</h2>
                <p className="text-white/50 text-sm">@{user.username}</p>
              </div>
            </div>
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className="neon-button"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-white font-mono text-sm bg-white/5 px-4 py-2 rounded-lg">{user.email}</p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-white/60 text-sm mb-2">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Display Name
                </span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-red/50"
                />
              ) : (
                <p className="text-white bg-white/5 px-4 py-2 rounded-lg">{user.displayName}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-white/60 text-sm mb-2">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Region
                </span>
              </label>
              {isEditing ? (
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-neon-red/50"
                >
                  <option value="">Select region</option>
                  <option value="NA">North America</option>
                  <option value="EU">Europe</option>
                  <option value="LATAM">Latin America</option>
                  <option value="APAC">Asia Pacific</option>
                  <option value="SEA">Southeast Asia</option>
                  <option value="ME">Middle East</option>
                </select>
              ) : (
                <p className="text-white bg-white/5 px-4 py-2 rounded-lg">{user.region || 'Not set'}</p>
              )}
            </div>

            {isEditing && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        </GlassCard>

        {/* Danger Zone */}
        {!user.roles.includes('super_admin') && (
          <GlassCard className="p-6 mb-6">
            <h3 className="font-orbitron text-white font-bold mb-4">Request Additional Role</h3>
            <p className="text-white/60 text-sm mb-4">
              Super Admin approval is required for organizer, clan leader, clan moderator, and spectator roles.
            </p>
            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-neon-red/50"
              >
                <option value="tournament_organizer">Tournament Organizer</option>
                <option value="clan_leader">Clan Leader</option>
                <option value="clan_moderator">Clan Moderator</option>
                <option value="spectator">Spectator</option>
              </select>
              <Button onClick={handleRoleRequest} disabled={requestingRole} className="neon-button">
                {requestingRole ? 'Submitting...' : 'Request Role'}
              </Button>
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-6 border-red-500/20">
          <h3 className="font-orbitron text-white font-bold mb-4">Account Actions</h3>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
