import { cn } from '@/lib/utils';

interface GlowBadgeProps {
  label: string;
  variant?: 'live' | 'pending' | 'verified' | 'disputed' | 'locked' | 'upcoming' | 'neutral';
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<NonNullable<GlowBadgeProps['variant']>, string> = {
  live: 'bg-neon-red/20 text-neon-red border-neon-red/40',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  verified: 'bg-neon-green/20 text-neon-green border-neon-green/40',
  disputed: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  locked: 'bg-white/10 text-white/50 border-white/20',
  upcoming: 'bg-neon-blue/20 text-neon-blue border-neon-blue/40',
  neutral: 'bg-white/10 text-white/60 border-white/20',
};

export function GlowBadge({ label, variant = 'neutral', pulse = false, className }: GlowBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-orbitron font-bold uppercase tracking-wider border',
        variantStyles[variant],
        className,
      )}
    >
      {(variant === 'live' || pulse) && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-neon" />
      )}
      {label}
    </span>
  );
}
