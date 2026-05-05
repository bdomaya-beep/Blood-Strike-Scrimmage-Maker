'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Plus, Pencil, Trash2, Pin, X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  isPinned: boolean;
  createdAt: string;
  author?: { username: string; displayName: string };
}

const CATEGORIES = ['GENERAL', 'UPDATE', 'TOURNAMENT', 'EVENT'];

const EMPTY: Omit<Announcement, 'id' | 'createdAt' | 'author'> = {
  title: '',
  content: '',
  category: 'GENERAL',
  imageUrl: '',
  isPinned: false,
};

function AdminAnnouncementsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ data: Announcement[]; meta: { total: number } }>(
        `/announcements?page=${page}&limit=20`,
      );
      setItems(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY }); setShowForm(true); setError(null); };
  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, category: a.category, imageUrl: a.imageUrl ?? '', isPinned: a.isPinned });
    setShowForm(true);
    setError(null);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setError('Title and content are required'); return; }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await apiClient.patch(`/announcements/${editing.id}`, form);
      } else {
        await apiClient.post('/announcements', form);
      }
      closeForm();
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await apiClient.delete(`/announcements/${id}`);
      load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white">Announcements</h1>
          <p className="text-white/50 text-sm mt-1">{total} total</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Announcement
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-orbitron font-semibold text-white">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
            <button onClick={closeForm} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Title *</label>
              <input
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Category</label>
              <select
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Image URL (optional)</label>
              <input
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Content *</label>
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-red/50 min-h-[120px] resize-y"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Announcement body text..."
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="pinned"
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                className="accent-neon-red"
              />
              <label htmlFor="pinned" className="text-sm text-white/70">Pin this announcement (shows at top)</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : (editing ? 'Save Changes' : 'Publish')}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>
      ) : items.length === 0 ? (
        <GlassCard className="p-10 text-center text-white/40">No announcements yet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <GlassCard key={a.id} className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.isPinned && <Pin className="w-3 h-3 text-yellow-400" />}
                  <span className="text-xs font-mono text-white/40 uppercase">{a.category}</span>
                  <span className="text-xs text-white/30">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-semibold text-white text-sm truncate">{a.title}</p>
                <p className="text-white/50 text-xs mt-1 line-clamp-2">{a.content}</p>
                {a.author && <p className="text-white/30 text-xs mt-1">by {a.author.displayName || a.author.username}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(a.id)} className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10">
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

export default function AdminAnnouncementsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>}><AdminAnnouncementsContent /></Suspense>;
}
