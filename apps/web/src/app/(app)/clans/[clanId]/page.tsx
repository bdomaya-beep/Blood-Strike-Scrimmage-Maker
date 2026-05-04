'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { Loader, Users, Trophy, ArrowLeft, Crown, Shield, User } from 'lucide-react';

interface ClanMember {
  id: string;
  userId: string;
  clanRole: 'CAPTAIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface ClanDetail {
  id: string;
  name: string;
  tag: string;
  description?: string;
  logoUrl?: string;
  region: string;
  totalPoints: number;
  wins: number;
  losses: number;
  status: string;
  captainUserId: string;
  createdAt: string;
  members: ClanMember[];
}

const roleIcon = (role: ClanMember['clanRole']) => {
  if (role === 'CAPTAIN') return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
  if (role === 'MODERATOR') return <Shield className="w-3.5 h-3.5 text-blue-400" />;
  return <User className="w-3.5 h-3.5 text-white/40" />;
};

const roleLabel = (role: ClanMember['clanRole']) => {
  if (role === 'CAPTAIN') return 'Captain';
  if (role === 'MODERATOR') return 'Moderator';
  return 'Member';
};

export default function ClanDetailPage() {
  const { clanId } = useParams<{ clanId: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchClan = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<ClanDetail>(`/clans/${clanId}`);
        setClan(data);
        setError(null);
      } catch {
        setError('Clan not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    if (clanId) fetchClan();
  }, [clanId]);

  const isMember = clan?.members.some((m) => m.user.id === user?.id);
  const isCaptain = clan?.captainUserId === user?.id;

  const handleRequestJoin = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    // Clans use an invite-based system. Show a message to contact the captain.
    setJoinMsg('Contact the clan captain to receive an invite.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-neon-red animate-spin" />
      </div>
    );
  }

  if (error || !clan) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <GlassCard className="p-8 text-center border-red-500/30">
          <p className="text-red-400 mb-4">{error ?? 'Clan not found'}</p>
          <Link href="/clans">
            <Button variant="outline">Back to Clans</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/clans" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Clans
        </Link>

        {/* Header card */}
        <GlassCard className="p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center flex-shrink-0 text-3xl font-orbitron font-black text-neon-red">
              {clan.logoUrl ? (
                <img src={clan.logoUrl} alt={clan.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                clan.tag.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-orbitron font-black text-white">{clan.name}</h1>
                <Badge className="bg-neon-red/20 text-neon-red border-neon-red/30">[{clan.tag}]</Badge>
                <Badge className="bg-white/10 text-white/60 border-white/20">{clan.region}</Badge>
              </div>
              {clan.description && <p className="text-white/60 mb-4 max-w-xl">{clan.description}</p>}

              {/* Stats */}
              <div className="flex gap-6 flex-wrap">
                <div className="text-center">
                  <div className="font-orbitron text-2xl font-black text-neon-red">{clan.totalPoints}</div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">Points</div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron text-2xl font-black text-green-400">{clan.wins}</div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">Wins</div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron text-2xl font-black text-white/40">{clan.losses}</div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">Losses</div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron text-2xl font-black text-blue-400">{clan.members.length}</div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">Members</div>
                </div>
              </div>
            </div>

            {/* Action */}
            {isAuthenticated && !isMember && !isCaptain && (
              <div className="flex-shrink-0">
                <Button onClick={handleRequestJoin} disabled={joining} className="neon-button">
                  {joining ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                  Request to Join
                </Button>
                {joinMsg && <p className="text-xs text-white/60 mt-2 max-w-xs">{joinMsg}</p>}
              </div>
            )}
            {isCaptain && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Your Clan
              </Badge>
            )}
            {isMember && !isCaptain && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Member</Badge>
            )}
          </div>
        </GlassCard>

        {/* Roster */}
        <GlassCard className="p-6">
          <h2 className="font-orbitron font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-red" />
            Roster ({clan.members.length})
          </h2>
          <div className="divide-y divide-white/5">
            {clan.members.length === 0 ? (
              <p className="text-white/40 py-4 text-center">No members yet.</p>
            ) : (
              clan.members
                .sort((a, b) => {
                  const order = { CAPTAIN: 0, MODERATOR: 1, MEMBER: 2 };
                  return order[a.clanRole] - order[b.clanRole];
                })
                .map((member) => (
                  <div key={member.id} className="flex items-center gap-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-orbitron font-bold text-sm text-white/70">
                      {member.user.displayName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{member.user.displayName}</p>
                      <p className="text-white/40 text-xs">@{member.user.username}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {roleIcon(member.clanRole)}
                      <span className="text-xs text-white/50">{roleLabel(member.clanRole)}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </GlassCard>

        {/* Match History placeholder */}
        <GlassCard className="p-6 mt-6">
          <h2 className="font-orbitron font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-neon-red" />
            Match History
          </h2>
          <p className="text-white/40 text-sm text-center py-4">Match history coming soon.</p>
        </GlassCard>
      </div>
    </div>
  );
}
