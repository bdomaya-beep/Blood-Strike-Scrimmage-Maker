import type { Metadata } from 'next';
import { GlassCard } from '@/components/ui/glass-card';
import { HudStatChip } from '@/components/ui/hud-stat-chip';
import { Swords, Trophy, Target } from 'lucide-react';

export const metadata: Metadata = { title: 'Leaderboard' };

async function getLeaderboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    // Global leaderboard — placeholder until global standings endpoint is added
    return { data: [] };
  } catch {
    return { data: [] };
  }
}

export default async function LeaderboardPage() {
  const { data: players } = await getLeaderboard();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-orbitron font-black text-3xl text-white mb-1">Leaderboard</h1>
        <p className="text-white/40 text-sm">Global all-time player rankings</p>
      </div>

      <GlassCard accent="red" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex gap-2">
            {['Players', 'Clans'].map((tab) => (
              <button
                key={tab}
                className="px-4 py-1.5 rounded-lg font-orbitron text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/10 transition-colors first:text-neon-red first:bg-neon-red/10"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/30 text-xs uppercase tracking-widest border-b border-white/5">
              <th className="px-4 py-3 text-left w-12">#</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Kills</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">Avg K/G</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">MVPs</th>
              <th className="px-4 py-3 text-right">Matches</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-white/20 font-orbitron text-sm">
                  No data yet — be the first to compete!
                </td>
              </tr>
            )}
            {players.map((p: any) => (
              <tr key={p.playerId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-orbitron font-black text-white/50">{p.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.avatarUrl && <img src={p.avatarUrl} alt="" className="w-7 h-7 rounded-full" />}
                    <div>
                      <div className="font-bold text-white text-sm">{p.displayName ?? p.username}</div>
                      <div className="text-white/30 text-xs">@{p.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-orbitron font-bold text-neon-red">{p.totalKills}</td>
                <td className="px-4 py-3 text-right text-white/60 hidden md:table-cell">{p.avgKills?.toFixed(1)}</td>
                <td className="px-4 py-3 text-right text-yellow-400 hidden md:table-cell">{p.mvpCount}</td>
                <td className="px-4 py-3 text-right text-white/40">{p.matches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
