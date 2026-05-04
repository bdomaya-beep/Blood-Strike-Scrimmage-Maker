import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LiveStandingsTable } from '@/components/features/live-standings-table';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowBadge } from '@/components/ui/glow-badge';
import { HudStatChip } from '@/components/ui/hud-stat-chip';
import { Swords, Users, Calendar, Globe } from 'lucide-react';

interface Props {
  params: { eventId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Event ${params.eventId}` };
}

async function getEvent(eventId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiUrl}/events/${eventId}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.eventId);
  if (!event) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Event header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GlowBadge label={event.status} variant={event.status === 'LIVE' ? 'live' : 'upcoming'} />
          <span className="text-white/30 text-xs font-orbitron">{event.type}</span>
        </div>
        <h1 className="font-orbitron font-black text-4xl text-white mb-2">{event.title}</h1>
        <p className="text-white/50 max-w-2xl">{event.description}</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        <HudStatChip label="Region" value={event.region ?? 'Global'} icon={<Globe className="w-3 h-3" />} />
        <HudStatChip label="Max Teams" value={event.maxTeams} icon={<Users className="w-3 h-3" />} />
        <HudStatChip
          label="Starts"
          value={new Date(event.startsAt).toLocaleDateString()}
          icon={<Calendar className="w-3 h-3" />}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings — span 2 cols */}
        <div className="lg:col-span-2">
          <LiveStandingsTable eventId={params.eventId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {event.rulesets?.[0] && (
            <GlassCard className="p-5">
              <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
                Active Ruleset
              </h3>
              <pre className="text-xs text-white/60 overflow-auto max-h-60">
                {JSON.stringify(event.rulesets[0].payloadJson, null, 2)}
              </pre>
            </GlassCard>
          )}

          {event.livestreamSessions?.[0] && (
            <GlassCard accent="red" className="p-5">
              <GlowBadge label="Live Stream" variant="live" className="mb-3" />
              <a
                href={event.livestreamSessions[0].channel?.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-blue text-sm hover:underline"
              >
                Watch on {event.livestreamSessions[0].channel?.platform}
              </a>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
