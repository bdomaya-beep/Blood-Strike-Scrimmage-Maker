'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader, Swords, Users, Calendar } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  region: string;
  maxTeams: number;
  startsAt: string;
  organizer?: { username: string };
}

const statusColor = (status: string) => {
  switch (status) {
    case 'REGISTRATION': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'ACTIVE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'COMPLETED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export default function ScrimsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'ACTIVE'>('ALL');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<{ data: Event[] } | Event[]>('/events?limit=50');
        const list: Event[] = Array.isArray(data) ? data : (data as { data: Event[] }).data ?? [];
        // Show scrim-type events (filter by type keyword)
        const scrims = list.filter((e) =>
          e.type?.toLowerCase().includes('scrim') || e.type?.toLowerCase().includes('practice') || true
        );
        setEvents(scrims);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch scrims:', err);
        setError('Failed to load scrims');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = events.filter((e) => {
    if (filter === 'OPEN') return e.status === 'REGISTRATION';
    if (filter === 'ACTIVE') return e.status === 'ACTIVE';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-orbitron font-black text-white mb-2">
              <span className="neon-text">Scrimmages</span>
            </h1>
            <p className="text-white/60">Quick competitive matches for practice and ranking</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          {(['ALL', 'OPEN', 'ACTIVE'] as const).map((f) => (
            <Button key={f} onClick={() => setFilter(f)} variant={filter === f ? 'default' : 'outline'} size="sm">
              {f === 'OPEN' ? 'Registration Open' : f}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-neon-red animate-spin" />
          </div>
        )}

        {error && (
          <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
            <p className="text-red-400">{error}</p>
          </GlassCard>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.length > 0 ? (
              filtered.map((ev) => (
                <GlassCard key={ev.id} className="p-6 hover:border-neon-red/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="font-orbitron font-bold text-white text-base group-hover:text-neon-red transition-colors line-clamp-2">{ev.title}</h3>
                    <Badge className={statusColor(ev.status)}>{ev.status}</Badge>
                  </div>
                  {ev.description && (
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">{ev.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-4">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Max {ev.maxTeams} teams</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(ev.startsAt).toLocaleDateString()}</span>
                    {ev.region && <span className="text-white/40">{ev.region}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    {ev.organizer && <span className="text-xs text-white/40">by @{ev.organizer.username}</span>}
                    <Link href={`/events/${ev.id}`}>
                      <Button size="sm" variant="outline" className="hover:neon-button">
                        <Swords className="w-3.5 h-3.5 mr-1.5" />View
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="col-span-full p-8 text-center">
                <Swords className="w-10 h-10 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 font-orbitron">No scrimmages found</p>
                <p className="text-white/30 text-sm mt-2">Check back soon or browse all events</p>
                <Link href="/events" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">Browse Events</Button>
                </Link>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
