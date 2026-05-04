'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Trophy } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  status: string;
}

interface StandingEntry {
  rank: number;
  id: string;
  username?: string;
  name?: string;
  wins: number;
  losses: number;
  points: number;
  displayName?: string;
  tag?: string;
}

export default function LeaderboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'PLAYERS' | 'CLANS'>('PLAYERS');

  // Fetch active events first
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await apiClient.get<{ data: Event[] }>('/events?status=ACTIVE&limit=10');
        const list = Array.isArray(data) ? data : (data as { data: Event[] }).data ?? [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
        else setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        if (tab === 'PLAYERS') {
          const { data } = await apiClient.get<StandingEntry[]>(`/events/${selectedEventId}/leaderboard`);
          setStandings((data || []).map((p, i) => ({ ...p, rank: i + 1 })));
        } else {
          const { data } = await apiClient.get<StandingEntry[]>(`/events/${selectedEventId}/standings`);
          setStandings((data || []).map((p, i) => ({ ...p, rank: i + 1 })));
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard');
        setStandings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [tab, selectedEventId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-orbitron font-black text-white mb-2">
            <span className="neon-text">Leaderboard</span>
          </h1>
          <p className="text-white/60">Global competitive rankings</p>
        </div>

        {/* Event Selector */}
        {events.length > 0 && (
          <div className="mb-6">
            <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">Event</label>
            <select
              className="bg-surface-800 border border-white/20 text-white rounded-lg px-4 py-2 text-sm"
              value={selectedEventId ?? ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['PLAYERS', 'CLANS'] as const).map((t) => (
            <Button
              key={t}
              onClick={() => setTab(t)}
              variant={tab === t ? 'default' : 'outline'}
              className={tab === t ? 'neon-button' : ''}
            >
              {t}
            </Button>
          ))}
        </div>

        {/* No events */}
        {!loading && events.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 font-orbitron">No active events yet</p>
            <p className="text-white/30 text-sm mt-2">Rankings will appear once events go live</p>
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

        {/* Leaderboard Table */}
        {!loading && (
          <GlassCard className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-white/50 text-sm font-orbitron">#</th>
                  <th className="px-6 py-4 text-left text-white/50 text-sm font-orbitron">{tab === 'PLAYERS' ? 'Player' : 'Clan'}</th>
                  <th className="px-6 py-4 text-right text-white/50 text-sm font-orbitron">Wins</th>
                  <th className="px-6 py-4 text-right text-white/50 text-sm font-orbitron hidden md:table-cell">Losses</th>
                  <th className="px-6 py-4 text-right text-white/50 text-sm font-orbitron">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.length > 0 ? (
                  standings.map((player, i) => (
                    <tr key={player.id} className={i % 2 === 0 ? 'bg-white/5' : ''} >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {player.rank <= 3 && <Trophy className="w-4 h-4 text-neon-red" />}
                          <span className="font-orbitron font-bold text-white">{player.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">{player.displayName ?? player.name ?? player.username ?? '—'}</td>
                      <td className="px-6 py-4 text-right text-neon-red font-bold">{player.wins}</td>
                      <td className="px-6 py-4 text-right text-white/60 hidden md:table-cell">{player.losses}</td>
                      <td className="px-6 py-4 text-right font-orbitron text-neon-orange font-bold">{player.points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white/60">
                      No standings data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
