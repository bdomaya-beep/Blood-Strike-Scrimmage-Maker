'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { NeonButton } from '@/components/ui/neon-button';
import { apiClient } from '@/lib/api-client';

interface ReadyCheckModalProps {
  matchId: string;
  clanName: string;
  closesAt: string;
  onConfirmed?: () => void;
}

export function ReadyCheckModal({ matchId, clanName, closesAt, onConfirmed }: ReadyCheckModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirmed' | 'error'>('idle');
  const secondsLeft = Math.max(0, Math.round((new Date(closesAt).getTime() - Date.now()) / 1000));

  const confirm = async () => {
    setStatus('loading');
    try {
      await apiClient.post(`/matches/${matchId}/ready-check/confirm`);
      setStatus('confirmed');
      onConfirmed?.();
    } catch {
      setStatus('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <GlassCard accent="red" className="w-full max-w-sm p-8 text-center">
        {/* Pulse ring */}
        <div className="relative mx-auto mb-6 w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-neon-red animate-ping opacity-30" />
          <div className="w-12 h-12 rounded-full border-2 border-neon-red flex items-center justify-center">
            <span className="font-orbitron text-neon-red font-black text-xl">{secondsLeft}</span>
          </div>
        </div>

        <h2 className="font-orbitron font-black text-white text-lg uppercase tracking-widest mb-2">
          Ready Check
        </h2>
        <p className="text-white/50 text-sm mb-6">
          <span className="text-white font-bold">{clanName}</span> — confirm your team is ready to compete.
          Failure to respond will result in a forfeit.
        </p>

        {status === 'confirmed' ? (
          <div className="text-neon-green font-orbitron font-bold uppercase text-sm tracking-wider">
            ✓ Confirmed — Stand By
          </div>
        ) : (
          <NeonButton
            onClick={confirm}
            disabled={status === 'loading'}
            size="lg"
            className="w-full"
          >
            {status === 'loading' ? 'Confirming...' : "We're Ready"}
          </NeonButton>
        )}

        {status === 'error' && (
          <p className="mt-3 text-neon-red text-xs">Failed to confirm. Try again.</p>
        )}
      </GlassCard>
    </motion.div>
  );
}
