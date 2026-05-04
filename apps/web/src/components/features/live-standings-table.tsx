'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLiveStandingsStore, type StandingsEntry } from '@/stores/live-standings-store';
import { GlassCard } from '@/components/ui/glass-card';
import { ScorePulseCell } from '@/components/ui/score-pulse-cell';
import { GlowBadge } from '@/components/ui/glow-badge';
import { apiClient } from '@/lib/api-client';

interface LiveStandingsTableProps {
  eventId: string;
}

export function LiveStandingsTable({ eventId }: LiveStandingsTableProps) {
  const { entries, isLive, version, lastUpdated, subscribe, unsubscribe, setEntries } =
    useLiveStandingsStore();

  useEffect(() => {
    // Fetch initial standings
    apiClient.get(`/events/${eventId}/standings`).then(({ data }) => {
      setEntries(data.entries, data.version);
    });

    // Subscribe to real-time updates
    subscribe(eventId);
    return () => unsubscribe();
  }, [eventId]);

  return (
    <GlassCard accent="red" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h2 className="font-orbitron font-black text-sm uppercase tracking-widest text-white">
          Live Standings
        </h2>
        <div className="flex items-center gap-3">
          {isLive && <GlowBadge label="Live" variant="live" pulse />}
          {lastUpdated && (
            <span className="text-xs text-white/30">
              v{version} · {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/30 text-xs uppercase tracking-widest border-b border-white/5">
              <th className="px-4 py-3 text-left w-12">#</th>
              <th className="px-4 py-3 text-left">Clan</th>
              <th className="px-4 py-3 text-right">Pts</th>
              <th className="px-4 py-3 text-right">Kills</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">Matches</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">Wins</th>
              <th className="px-4 py-3 text-center w-16">Δ</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {entries.map((entry) => (
                <motion.tr
                  key={entry.clanId}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-orbitron font-black text-white/50">{entry.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.logoUrl && (
                        <img src={entry.logoUrl} alt="" className="w-6 h-6 rounded object-cover" />
                      )}
                      <div>
                        <div className="font-bold text-white text-sm">{entry.clanName}</div>
                        <div className="text-white/30 text-xs">[{entry.clanTag}]</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ScorePulseCell value={entry.totalPoints} className="text-neon-yellow" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ScorePulseCell value={entry.totalKills} className="text-neon-red" />
                  </td>
                  <td className="px-4 py-3 text-right text-white/60 hidden md:table-cell">
                    {entry.matchesPlayed}
                  </td>
                  <td className="px-4 py-3 text-right text-neon-green hidden md:table-cell">
                    {entry.wins}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RankDelta delta={entry.rankDelta ?? 0} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="py-12 text-center text-white/30 text-sm">No standings data yet</div>
        )}
      </div>
    </GlassCard>
  );
}

function RankDelta({ delta }: { delta: number }) {
  if (delta === 0) return <Minus className="w-3 h-3 text-white/20 mx-auto" />;
  if (delta > 0)
    return (
      <span className="flex items-center justify-center gap-0.5 text-neon-green text-xs font-bold">
        <TrendingUp className="w-3 h-3" />
        {delta}
      </span>
    );
  return (
    <span className="flex items-center justify-center gap-0.5 text-neon-red text-xs font-bold">
      <TrendingDown className="w-3 h-3" />
      {Math.abs(delta)}
    </span>
  );
}
