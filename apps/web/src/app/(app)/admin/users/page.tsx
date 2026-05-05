'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Plus, UserX, UserCheck, Shield, X, Search } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  region?: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  roles: string[];
}

const ROLES = ['organizer', 'clan_leader', 'clan_moderator', 'player', 'spectator'];
const REGIONS = ['NA', 'EU', 'ASIA', 'SA', 'OCE', 'ME', 'GLOBAL'];

const EMPTY_FORM = { username: '', email: '', password: '', displayName: '', region: 'GLOBAL' };

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [grantingRoleFor, setGrantingRoleFor] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('player');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', ...(search ? { search } : {}) });
      const { data } = await apiClient.get<{ data: User[]; meta: { total: number } }>(`/auth/admin/users?${qs}`);
      setUsers(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const createUser = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Username, email, and password are required'); return;
    }
    setSaving(true); setFormError(null);
    try {
      await apiClient.post('/auth/admin/users', { ...form, displayName: form.displayName || form.username });
      setForm({ ...EMPTY_FORM }); setShowForm(false); load();
    } catch (e: any) { setFormError(e?.response?.data?.message || 'Create failed'); } finally { setSaving(false); }
  };

  const setStatus = async (userId: string, status: string) => {
    try { await apiClient.patch(`/auth/admin/users/${userId}/status`, { status }); load(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  const grantRole = async (userId: string) => {
    try {
      await apiClient.post(`/auth/admin/users/${userId}/roles/${selectedRole}`, {});
      setGrantingRoleFor(null); load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  const statusBadge = (s: string) => {
    if (s === 'ACTIVE') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s === 'SUSPENDED') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (s === 'BANNED') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-white/40 bg-white/5 border-white/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white">Users</h1>
          <p className="text-white/50 text-sm mt-1">{total} total</p>
        </div>
        <Button onClick={() => { setShowForm(true); setFormError(null); }} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Create Account
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red/50"
            placeholder="Search username, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
        {search && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>Clear</Button>}
      </div>

      {/* Create User Form */}
      {showForm && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-orbitron font-semibold text-white">Create User Account</h2>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Username *</label>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="username" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Email *</label>
              <input type="email" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Password *</label>
              <input type="password" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Temporary password" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Display Name</label>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} placeholder="(optional)" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Region</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <p className="text-white/30 text-xs">Account will be created with the <span className="text-neon-red">player</span> role. You can assign additional roles after creation.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={createUser} disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* User List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>
      ) : users.length === 0 ? (
        <GlassCard className="p-10 text-center text-white/40">No users found.</GlassCard>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <GlassCard key={u.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-neon-red/20 border border-neon-red/30 flex items-center justify-center shrink-0 text-sm font-bold text-neon-red">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{u.displayName || u.username}</span>
                    <span className="text-white/40 text-xs">@{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(u.status)}`}>{u.status}</span>
                    {u.isVerified && <span className="text-xs text-green-400">✓ verified</span>}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{u.email} {u.region && `· ${u.region}`}</p>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {u.roles.map((r) => (
                      <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-neon-red/10 border border-neon-red/20 text-neon-red/80 font-mono">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {/* Grant Role */}
                  {grantingRoleFor === u.id ? (
                    <div className="flex gap-2 items-center">
                      <select className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <Button size="sm" onClick={() => grantRole(u.id)}>Grant</Button>
                      <button onClick={() => setGrantingRoleFor(null)} className="text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setGrantingRoleFor(u.id); setSelectedRole('player'); }}
                      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-neon-red transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" /> Assign Role
                    </button>
                  )}
                  {/* Status actions */}
                  <div className="flex gap-2">
                    {u.status === 'ACTIVE' && (
                      <button onClick={() => setStatus(u.id, 'SUSPENDED')} className="flex items-center gap-1 text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors">
                        <UserX className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <button onClick={() => setStatus(u.id, 'ACTIVE')} className="flex items-center gap-1 text-xs text-green-400/60 hover:text-green-400 transition-colors">
                        <UserCheck className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    {u.status !== 'BANNED' && (
                      <button onClick={() => setStatus(u.id, 'BANNED')} className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors">
                        <UserX className="w-3.5 h-3.5" /> Ban
                      </button>
                    )}
                    {u.status === 'BANNED' && (
                      <button onClick={() => setStatus(u.id, 'ACTIVE')} className="flex items-center gap-1 text-xs text-green-400/60 hover:text-green-400 transition-colors">
                        <UserCheck className="w-3.5 h-3.5" /> Unban
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <span className="text-white/50 text-sm self-center">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>Next</Button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>}><AdminUsersContent /></Suspense>;
}
