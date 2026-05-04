import type { Metadata } from 'next';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowBadge } from '@/components/ui/glow-badge';

export const metadata: Metadata = { title: 'Clans' };

async function getClans(page = 1) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiUrl}/clans?limit=24&page=${page}`, { next: { revalidate: 60 } });
    if (!res.ok) return { data: [], meta: { total: 0 } };
    return res.json();
  } catch {
    return { data: [], meta: { total: 0 } };
  }
}

export default async function ClansPage() {
  const { data: clans, meta } = await getClans();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-orbitron font-black text-3xl text-white mb-1">Clans</h1>
          <p className="text-white/40 text-sm">{meta.total} registered clans</p>
        </div>
        <Link
          href="/clans/create"
          className="px-5 py-2 rounded-lg font-orbitron text-xs font-bold tracking-wider uppercase gradient-brand text-white shadow-neon hover:opacity-90 transition-opacity"
        >
          + Create Clan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clans.map((clan: any) => (
          <Link key={clan.id} href={`/clans/${clan.id}`}>
            <GlassCard className="p-5 hover:border-neon-red/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                {clan.logoUrl ? (
                  <img src={clan.logoUrl} alt={clan.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-neon-red/20 border border-neon-red/30 flex items-center justify-center font-orbitron font-black text-neon-red text-sm">
                    {clan.tag?.slice(0, 3)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm group-hover:text-neon-red transition-colors truncate">
                    {clan.name}
                  </div>
                  <div className="text-white/40 text-xs">[{clan.tag}]</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">{clan.region ?? 'Global'}</span>
                <span className="font-orbitron text-neon-yellow font-bold">{clan.totalPoints ?? 0} pts</span>
              </div>
            </GlassCard>
          </Link>
        ))}
        {clans.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/20 font-orbitron text-sm">
            No clans found
          </div>
        )}
      </div>
    </div>
  );
}
