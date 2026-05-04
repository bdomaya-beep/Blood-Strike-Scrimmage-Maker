import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowBadge } from '@/components/ui/glow-badge';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Events' };

async function getEvents() {
  // Server-side fetch — use absolute URL via env var
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiUrl}/events?limit=12`, { next: { revalidate: 30 } });
    if (!res.ok) return { data: [], meta: { total: 0 } };
    return res.json();
  } catch {
    return { data: [], meta: { total: 0 } };
  }
}

export default async function EventsPage() {
  const { data: events, meta } = await getEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-orbitron font-black text-3xl text-white mb-1">Events</h1>
          <p className="text-white/40 text-sm">{meta.total} events available</p>
        </div>
        <Link
          href="/events/create"
          className="relative inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-neon-red to-neon-orange px-3 py-1.5 font-orbitron text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          + Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Scrimmage', 'Tournament', 'Ranked'].map((f) => (
          <button
            key={f}
            className="flex-shrink-0 px-4 py-1.5 rounded-full border border-white/20 text-white/50 text-xs font-orbitron uppercase tracking-wider hover:border-neon-red/50 hover:text-neon-red transition-colors"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event: any) => (
          <EventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/20 font-orbitron text-sm">
            No events found
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const statusVariant: Record<string, any> = {
    DRAFT: 'neutral',
    REGISTRATION_OPEN: 'upcoming',
    LIVE: 'live',
    COMPLETED: 'locked',
  };

  return (
    <Link href={`/events/${event.id}`}>
      <GlassCard className="p-5 h-full hover:border-neon-red/30 transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <GlowBadge label={event.status ?? 'Upcoming'} variant={statusVariant[event.status] ?? 'neutral'} />
          <span className="text-white/30 text-xs">{event.region}</span>
        </div>
        <h3 className="font-orbitron font-bold text-white text-base mb-2 group-hover:text-neon-red transition-colors">
          {event.title}
        </h3>
        <p className="text-white/40 text-xs line-clamp-2 mb-4">{event.description}</p>
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>{event.type}</span>
          <span>{event.maxTeams} teams max</span>
        </div>
      </GlassCard>
    </Link>
  );
}
