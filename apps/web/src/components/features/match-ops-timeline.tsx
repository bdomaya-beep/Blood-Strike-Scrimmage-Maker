'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Swords, Shield } from 'lucide-react';
import { useMatchOpsStore, type MatchOpsEvent, type MatchStatus } from '@/stores/match-ops-store';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowBadge } from '@/components/ui/glow-badge';

const statusVariant: Record<MatchStatus, 'live' | 'pending' | 'verified' | 'disputed' | 'locked' | 'upcoming' | 'neutral'> = {
  SCHEDULED: 'upcoming',
  READY_CHECK: 'pending',
  LIVE: 'live',
  RESULT_PENDING: 'pending',
  DISPUTED: 'disputed',
  VERIFIED: 'verified',
  LOCKED: 'locked',
};

const eventIcon: Record<string, React.ReactNode> = {
  'match.readycheck.started': <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  'match.player.ready': <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />,
  'match.started': <Swords className="w-3.5 h-3.5 text-neon-red" />,
  'match.dispute.opened': <AlertCircle className="w-3.5 h-3.5 text-orange-400" />,
  'match.verified': <Shield className="w-3.5 h-3.5 text-neon-blue" />,
};

interface MatchOpsTimelineProps {
  matchId: string;
}

export function MatchOpsTimeline({ matchId }: MatchOpsTimelineProps) {
  const { events, status, subscribe, unsubscribe } = useMatchOpsStore();

  useEffect(() => {
    subscribe(matchId);
    return () => unsubscribe();
  }, [matchId]);

  return (
    <GlassCard accent="blue" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white/60">
          Match Ops
        </h3>
        {status && <GlowBadge label={status.replace('_', ' ')} variant={statusVariant[status] ?? 'neutral'} />}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2.5 text-sm"
            >
              <div className="mt-0.5 flex-shrink-0">
                {eventIcon[event.type] ?? <div className="w-2 h-2 rounded-full bg-white/20 mt-1 ml-0.75" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/80 text-xs leading-tight">
                  {event.type.replace(/\./g, ' › ')}
                </div>
                <div className="text-white/30 text-[10px] mt-0.5">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div className="text-center text-white/20 text-xs py-8">Waiting for match events...</div>
        )}
      </div>
    </GlassCard>
  );
}
