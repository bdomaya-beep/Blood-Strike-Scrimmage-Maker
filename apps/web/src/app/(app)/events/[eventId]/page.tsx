'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { Loader, Calendar, Users, Share2, Swords, ArrowLeft } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  maxTeams: number;
  type: string;
  region: string;
  status: string;
  organizer?: { id: string; username: string };
  rulesets?: Array<{ payloadJson: Record<string, unknown> }>;
}

interface Match {
  id: string;
  status: string;
  startsAt: string;
  participants: Array<{ clan: { id: string; name: string; tag: string } }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { user, isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchEventAndStatus = async () => {
      try {
        setLoading(true);
        const eventRes = await apiClient.get<Event>(`/events/${eventId}`);
        setEvent(eventRes.data);

        // Fetch matches for this event
        try {
          const matchRes = await apiClient.get<Match[]>(`/events/${eventId}/matches`);
          setMatches(Array.isArray(matchRes.data) ? matchRes.data : []);
        } catch {
          setMatches([]);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Failed to load event details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventAndStatus();
    }
  }, [eventId]);

  const handleRegister = async () => {
    if (!event) return;
    if (!isAuthenticated) { window.location.href = '/login'; return; }

    try {
      setIsRegistering(true);
      await apiClient.post(`/events/${eventId}/register`, { clanId: user?.id });
      setRegistered(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message ?? 'Failed to register for event.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-neon-red animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
          <p className="text-red-400">{error || 'Event not found'}</p>
          <Link href="/events" className="text-neon-red hover:underline text-sm mt-2 inline-block">← Back to Events</Link>
        </GlassCard>
      </div>
    );
  }

  const matchStatusColor = (s: string) => {
    if (s === 'LIVE') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s === 'SCHEDULED') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (s === 'VERIFIED') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/events" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to Events
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge className="bg-neon-red/20 text-neon-red border-neon-red/30">{event.status}</Badge>
            <Badge className="bg-white/10 text-white/60 border-white/20">{event.type}</Badge>
            <Badge className="bg-white/10 text-white/60 border-white/20">{event.region}</Badge>
          </div>
          <h1 className="text-4xl font-orbitron font-black text-white mb-3">{event.title}</h1>
          {event.description && <p className="text-white/70 text-base leading-relaxed">{event.description}</p>}
          {event.organizer && <p className="text-white/40 text-sm mt-2">Organized by @{event.organizer.username}</p>}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-neon-red" />
              <h3 className="font-orbitron font-bold text-white">Schedule</h3>
            </div>
            <div className="space-y-3 text-white/70">
              <div>
                <p className="text-white/50 text-sm">Start Date</p>
                <p className="text-lg font-semibold">{new Date(event.startsAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">End Date</p>
                <p className="text-lg font-semibold">{event.endsAt ? new Date(event.endsAt).toLocaleString() : 'TBD'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-neon-red" />
              <h3 className="font-orbitron font-bold text-white">Participants</h3>
            </div>
            <div className="text-center py-2">
              <p className="text-4xl font-bold neon-text">
                <span className="text-2xl text-white/50">Max</span> {event.maxTeams} <span className="text-2xl text-white/50">teams</span>
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Ruleset */}
        {event.rulesets && event.rulesets.length > 0 && (
          <GlassCard className="p-6 mb-8">
            <h3 className="font-orbitron font-bold text-white mb-4">Active Ruleset</h3>
            <pre className="text-white/70 text-xs overflow-auto">{JSON.stringify(event.rulesets[0].payloadJson, null, 2)}</pre>
          </GlassCard>
        )}

        {/* Registration Actions */}
        <div className="flex gap-4 mb-8">
          {registered ? (
            <GlassCard className="p-6 flex-1 border-green-500/30 bg-green-500/5">
              <p className="text-green-400">✓ Registration submitted! Check back when the event goes live.</p>
            </GlassCard>
          ) : event.status === 'REGISTRATION' ? (
            <Button onClick={handleRegister} disabled={isRegistering} size="lg" className="flex-1 neon-button">
              {isRegistering ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRegistering ? 'Registering...' : 'Register Clan'}
            </Button>
          ) : (
            <GlassCard className="p-6 flex-1 border-orange-500/30 bg-orange-500/5">
              <p className="text-orange-400 text-sm">
                {event.status === 'DRAFT' ? 'This event is not yet open for registration.' : 'Registration is closed for this event.'}
              </p>
            </GlassCard>
          )}
          <Button size="lg" variant="outline" title="Share" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Matches */}
        {matches.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="font-orbitron font-bold text-white text-lg mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-neon-red" />
              Matches ({matches.length})
            </h2>
            <div className="space-y-3">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <Badge className={matchStatusColor(match.status)}>{match.status}</Badge>
                      <span className="text-white/60 text-sm">{match.participants.map((p) => p.clan.name).join(' vs ') || 'TBD vs TBD'}</span>
                    </div>
                    <span className="text-white/40 text-xs">{new Date(match.startsAt).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

