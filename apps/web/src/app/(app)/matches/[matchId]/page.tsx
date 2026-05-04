'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { Loader, ArrowLeft, Swords, CheckCircle, Clock, AlertTriangle, Trophy, Upload } from 'lucide-react';

interface MatchParticipant {
  id: string;
  clanId: string;
  slotNo: number;
  readyState: 'PENDING' | 'READY' | 'NOT_READY';
  clan: {
    id: string;
    name: string;
    tag: string;
    logoUrl?: string;
  };
}

interface MatchRoom {
  id: string;
  roomLabel: string;
}

interface MatchResult {
  id: string;
  submittedAt: string;
  verificationState: 'PENDING' | 'APPROVED' | 'REJECTED';
  summaryJson: {
    placements?: Array<{ clanId: string; placement: number }>;
  };
}

interface MatchDetail {
  id: string;
  eventId: string;
  status: 'SCHEDULED' | 'READY_CHECK' | 'LIVE' | 'RESULT_PENDING' | 'VERIFIED' | 'DISPUTED' | 'LOCKED' | 'CANCELED';
  startsAt: string;
  endedAt?: string;
  participants: MatchParticipant[];
  rooms: MatchRoom[];
  result?: MatchResult;
  disputes: { id: string; status: string }[];
}

const statusColors: Record<MatchDetail['status'], string> = {
  SCHEDULED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  READY_CHECK: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  RESULT_PENDING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  VERIFIED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DISPUTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  LOCKED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  CANCELED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [submitForm, setSubmitForm] = useState(false);
  const [placements, setPlacements] = useState<Array<{ clanId: string; placement: number }>>([]);

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<MatchDetail>(`/matches/${matchId}`);
      setMatch(data);
      // Pre-fill placement form
      if (data.participants.length > 0 && placements.length === 0) {
        setPlacements(data.participants.map((p, i) => ({ clanId: p.clanId, placement: i + 1 })));
      }
      setError(null);
    } catch {
      setError('Match not found or failed to load.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) fetchMatch();
  }, [matchId, fetchMatch]);

  const handleReady = async () => {
    try {
      setActionLoading(true);
      await apiClient.post(`/matches/${matchId}/ready-check/confirm`);
      await fetchMatch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message ?? 'Failed to confirm ready');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await apiClient.post(`/matches/${matchId}/results`, {
        summary: { placements, killLogs: [] },
      });
      setSubmitForm(false);
      await fetchMatch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message ?? 'Failed to submit result');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-neon-red animate-spin" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <GlassCard className="p-8 text-center border-red-500/30">
          <p className="text-red-400 mb-4">{error ?? 'Match not found'}</p>
          <Link href="/events"><Button variant="outline">Back to Events</Button></Link>
        </GlassCard>
      </div>
    );
  }

  const userParticipant = isAuthenticated
    ? match.participants.find((p) => p.clan?.id === user?.id) 
    : null;
  const isReadyCheckOpen = match.status === 'READY_CHECK';
  const canSubmitResult = match.status === 'RESULT_PENDING' && isAuthenticated;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link href={`/events/${match.eventId}`} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        {/* Match Header */}
        <GlassCard className="p-8 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-neon-red" />
              <h1 className="text-2xl font-orbitron font-black text-white">Match Room</h1>
            </div>
            <Badge className={statusColors[match.status]}>{match.status.replace('_', ' ')}</Badge>
          </div>

          {/* VS display */}
          <div className="flex items-center justify-center gap-8 my-8">
            {match.participants.map((p, i) => (
              <div key={p.id} className="text-center">
                <div className="w-16 h-16 rounded-xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center text-xl font-orbitron font-black text-neon-red mx-auto mb-2">
                  {p.clan.logoUrl ? (
                    <img src={p.clan.logoUrl} alt={p.clan.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    p.clan.tag.slice(0, 2).toUpperCase()
                  )}
                </div>
                <Link href={`/clans/${p.clanId}`} className="font-orbitron font-bold text-white hover:text-neon-red transition-colors text-sm">
                  {p.clan.name}
                </Link>
                <p className="text-white/40 text-xs">[{p.clan.tag}]</p>
                {isReadyCheckOpen && (
                  <div className={`mt-2 flex items-center justify-center gap-1 text-xs ${
                    p.readyState === 'READY' ? 'text-green-400' : p.readyState === 'NOT_READY' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {p.readyState === 'READY' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {p.readyState}
                  </div>
                )}
                {i === 0 && match.participants.length > 1 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
            {match.participants.length >= 2 && (
              <div className="font-orbitron font-black text-3xl text-white/20 order-1">VS</div>
            )}
          </div>

          {/* Match Info */}
          <div className="flex flex-wrap gap-6 text-sm text-white/50">
            <div>
              <span className="text-white/30 uppercase tracking-wider text-xs">Scheduled</span>
              <p className="text-white">{new Date(match.startsAt).toLocaleString()}</p>
            </div>
            {match.endedAt && (
              <div>
                <span className="text-white/30 uppercase tracking-wider text-xs">Ended</span>
                <p className="text-white">{new Date(match.endedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Ready Check Action */}
        {isReadyCheckOpen && isAuthenticated && (
          <GlassCard className="p-6 mb-6 border-yellow-500/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="font-orbitron font-bold text-white">Ready Check Active</h2>
            </div>
            <p className="text-white/60 text-sm mb-4">Confirm that your clan is ready to play.</p>
            <Button onClick={handleReady} disabled={actionLoading} className="neon-button">
              {actionLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirm Ready
            </Button>
          </GlassCard>
        )}

        {/* Room Credentials */}
        {match.rooms.length > 0 && match.status === 'LIVE' && (
          <GlassCard className="p-6 mb-6 border-green-500/20">
            <h2 className="font-orbitron font-bold text-white mb-4">Room Details</h2>
            <div className="space-y-2">
              {match.rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white text-sm font-medium">{room.roomLabel}</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Result */}
        {match.result && (
          <GlassCard className="p-6 mb-6">
            <h2 className="font-orbitron font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-neon-red" />
              Result
            </h2>
            <Badge className={match.result.verificationState === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
              {match.result.verificationState}
            </Badge>
            {match.result.summaryJson.placements && (
              <div className="mt-4 space-y-2">
                {match.result.summaryJson.placements.map((p) => {
                  const participant = match.participants.find((mp) => mp.clanId === p.clanId);
                  return (
                    <div key={p.clanId} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <span className="font-orbitron font-bold text-neon-red text-lg">#{p.placement}</span>
                      <span className="text-white">{participant?.clan.name ?? p.clanId}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {/* Submit Result */}
        {canSubmitResult && !match.result && (
          <GlassCard className="p-6 mb-6 border-orange-500/20">
            <h2 className="font-orbitron font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-400" />
              Submit Match Result
            </h2>
            {!submitForm ? (
              <Button onClick={() => setSubmitForm(true)} variant="outline">Enter Results</Button>
            ) : (
              <form onSubmit={handleSubmitResult} className="space-y-4">
                <p className="text-white/60 text-sm">Set finishing placement for each clan:</p>
                {match.participants.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="text-white text-sm w-32">{p.clan.name}</span>
                    <select
                      className="bg-surface-800 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                      value={placements[i]?.placement ?? i + 1}
                      onChange={(e) => {
                        const updated = [...placements];
                        updated[i] = { clanId: p.clanId, placement: Number(e.target.value) };
                        setPlacements(updated);
                      }}
                    >
                      {match.participants.map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>#{idx + 1}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="flex gap-3">
                  <Button type="submit" disabled={actionLoading} className="neon-button">
                    {actionLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSubmitForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </GlassCard>
        )}

        {/* Disputes */}
        {match.disputes.length > 0 && (
          <GlassCard className="p-6 border-red-500/20">
            <h2 className="font-orbitron font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Active Disputes ({match.disputes.length})
            </h2>
            <p className="text-white/50 text-sm">A dispute is under review. An organizer will resolve this shortly.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
