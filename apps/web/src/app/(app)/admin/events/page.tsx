'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Plus, Pencil, Trash2, X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: string;
  status: string;
  region: string;
  startsAt: string;
  endsAt?: string;
  maxTeams: number;
  organizer?: { username: string };
}

const STATUSES = ['DRAFT', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELED'];
const TYPES = ['SCRIM', 'TOURNAMENT', 'LEAGUE', 'PRACTICE_WAR'];
const REGIONS = ['NA', 'EU', 'ASIA', 'SA', 'OCE', 'ME', 'GLOBAL'];

const EMPTY = { title: '', type: 'SCRIM', region: 'GLOBAL', startsAt: '', endsAt: '', maxTeams: 16, description: '', visibility: 'public' };

function AdminEventsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', ...(statusFilter ? { status: statusFilter } : {}) });
      const { data } = await apiClient.get<{ data: Event[]; meta: { total: number } }>(`/events?${qs}`);
      setItems(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY }); setShowForm(true); setError(null); };
  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({
      title: e.title, type: e.type, region: e.region,
      startsAt: e.startsAt ? e.startsAt.slice(0, 16) : '',
      endsAt: e.endsAt ? e.endsAt.slice(0, 16) : '',
      maxTeams: e.maxTeams, description: '', visibility: 'public',
    });
    setShowForm(true); setError(null);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const save = async () => {
    if (!form.title.trim() || !form.startsAt) { setError('Title and start date are required'); return; }
    setSaving(true); setError(null);
    try {
      if (editing) {
        await apiClient.patch(`/events/${editing.id}`, form);
      } else {
        await apiClient.post('/events', form);
      }
      closeForm(); load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Save failed'); } finally { setSaving(false); }
  };

  const setStatus = async (id: string, status: string) => {
    try { await apiClient.patch(`/events/${id}/status`, { status }); load(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try { await apiClient.delete(`/events/${id}`); load(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Delete failed'); }
  };

  const statusColor = (s: string) => {
    if (s === 'ACTIVE') return 'text-green-400';
    if (s === 'REGISTRATION') return 'text-blue-400';
    if (s === 'CANCELED') return 'text-red-400';
    if (s === 'COMPLETED') return 'text-white/40';
    return 'text-yellow-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white">Events</h1>
          <p className="text-white/50 text-sm mt-1">{total} total</p>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-2" /> New Event</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${!statusFilter ? 'border-neon-red text-neon-red bg-neon-red/10' : 'border-white/10 text-white/50 hover:border-white/30'}`}
        >All</button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${statusFilter === s ? 'border-neon-red text-neon-red bg-neon-red/10' : 'border-white/10 text-white/50 hover:border-white/30'}`}
          >{s}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-orbitron font-semibold text-white">{editing ? 'Edit Event' : 'New Event'}</h2>
            <button onClick={closeForm} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Title *</label>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Type</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Region</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Starts At *</label>
              <input type="datetime-local" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Ends At</label>
              <input type="datetime-local" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Max Teams</label>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.maxTeams} onChange={(e) => setForm((f) => ({ ...f, maxTeams: +e.target.value }))} min={2} max={256} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : (editing ? 'Save Changes' : 'Create Event')}
            </Button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>
      ) : items.length === 0 ? (
        <GlassCard className="p-10 text-center text-white/40">No events found.</GlassCard>
      ) : (
        <div className="space-y-2">
          {items.map((ev) => (
            <GlassCard key={ev.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-mono font-bold uppercase ${statusColor(ev.status)}`}>{ev.status}</span>
                  <span className="text-xs text-white/30">{ev.type} · {ev.region}</span>
                </div>
                <p className="font-semibold text-white text-sm truncate">{ev.title}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {new Date(ev.startsAt).toLocaleString()} · max {ev.maxTeams} teams
                  {ev.organizer && ` · by ${ev.organizer.username}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white/70"
                  value={ev.status}
                  onChange={(e) => setStatus(ev.id, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => openEdit(ev)} className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(ev.id)} className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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

export default function AdminEventsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>}><AdminEventsContent /></Suspense>;
}
