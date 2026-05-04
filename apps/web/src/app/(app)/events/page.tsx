'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  maxTeams: number;
  type: string;
  region: string;
  status: 'DRAFT' | 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<{ data: Event[] } | Event[]>('/events?limit=50');
        const list: Event[] = Array.isArray(data) ? data : (data as { data: Event[] }).data ?? [];
        setEvents(list);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'REGISTRATION': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ACTIVE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'COMPLETED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CANCELED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'OPEN') return event.status === 'REGISTRATION';
    if (filter === 'ACTIVE') return event.status === 'ACTIVE';
    if (filter === 'COMPLETED') return event.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-orbitron font-black text-white mb-2">
            <span className="neon-text">Events</span>
          </h1>
          <p className="text-white/60">Browse and register for competitive tournaments</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {(['ALL', 'OPEN', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
            >
              {f}
            </Button>
          ))}
        </div>

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

        {/* Events Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <GlassCard className="h-full hover:border-neon-red/50 transition-all cursor-pointer group">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h2 className="text-xl font-orbitron font-bold text-white group-hover:text-neon-red transition-colors line-clamp-2">
                            {event.title}
                          </h2>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                            <Badge className="bg-white/10 text-white/50 border-white/20 text-xs">{event.type}</Badge>
                          </div>
                        </div>
                      </div>
                      {event.description && <p className="text-white/60 text-sm mb-4 line-clamp-2">{event.description}</p>}
                      <div className="space-y-1 mb-4 text-sm">
                        <p className="text-white/50">
                          <span className="text-white/70">Starts:</span> {new Date(event.startsAt).toLocaleDateString()}
                        </p>
                        <p className="text-white/50">
                          <span className="text-white/70">Region:</span> {event.region}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/40 text-xs">Max {event.maxTeams} teams</span>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-white/60">No events found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
