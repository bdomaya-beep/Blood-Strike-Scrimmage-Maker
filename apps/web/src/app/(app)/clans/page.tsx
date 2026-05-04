'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Plus, Users } from 'lucide-react';

interface Clan {
  id: string;
  name: string;
  tag: string;
  description?: string;
  logoUrl?: string;
  region?: string;
  memberCount?: number;
  totalPoints?: number;
}

interface CreateClanForm {
  name: string;
  tag: string;
  region: string;
  description: string;
}

export default function ClansPage() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateClanForm>({ name: '', tag: '', region: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClans();
  }, []);

  const fetchClans = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<{ data: Clan[] } | Clan[]>('/clans');
      const list: Clan[] = Array.isArray(data) ? data : (data as { data: Clan[] }).data ?? [];
      setClans(list);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch clans:', err);
      setError('Failed to load clans.');
      setClans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await apiClient.post('/clans', formData);
      setFormData({ name: '', tag: '', region: '', description: '' });
      setShowCreateForm(false);
      await fetchClans();
    } catch (err) {
      console.error('Failed to create clan:', err);
      alert('Failed to create clan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-orbitron font-black text-white mb-2">
              <span className="neon-text">Clans</span>
            </h1>
            <p className="text-white/60">Build your team and compete</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="neon-button">
            <Plus className="w-4 h-4 mr-2" />
            Create Clan
          </Button>
        </div>

        {/* Create Clan Form */}
        {showCreateForm && (
          <GlassCard className="p-6 mb-8">
            <form onSubmit={handleCreateClan} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Clan Name</label>
                <input
                  type="text"
                  placeholder="Enter clan name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-red/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Tag (3-5 chars)</label>
                  <input
                    type="text"
                    placeholder="TAG"
                    maxLength={5}
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-red/50 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. SEA"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-red/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Description</label>
                <textarea
                  placeholder="Tell us about your clan"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-neon-red/50"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="neon-button">
                  {isSubmitting ? 'Creating...' : 'Create Clan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-neon-red animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
            <p className="text-red-400">{error}</p>
          </GlassCard>
        )}

        {/* Clans Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clans.length > 0 ? (
              clans.map((clan) => (
                <Link key={clan.id} href={`/clans/${clan.id}`}>
                  <GlassCard className="h-full hover:border-neon-red/50 transition-all cursor-pointer group p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {clan.logoUrl ? (
                        <img src={clan.logoUrl} alt={clan.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neon-red/20 border border-neon-red/30 flex items-center justify-center font-orbitron font-black text-neon-red">
                          {clan.tag?.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-orbitron font-bold text-white group-hover:text-neon-red transition-colors">
                          {clan.name}
                        </h3>
                        <p className="text-white/50 text-sm">[{clan.tag}]</p>
                      </div>
                    </div>
                    {clan.description && (
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">{clan.description}</p>
                    )}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-white/60">
                        <Users className="w-4 h-4" />
                        {clan.memberCount || 0}
                      </div>
                      <span className="text-neon-red font-bold">{clan.totalPoints || 0} pts</span>
                    </div>
                  </GlassCard>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-white/60">No clans yet. Be the first to create one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
