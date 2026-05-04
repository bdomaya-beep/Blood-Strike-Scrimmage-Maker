import { cn } from '@/lib/utils';

interface HudStatChipProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'default' | 'kills' | 'wins' | 'points';
  className?: string;
}

export function HudStatChip({ label, value, icon, variant = 'default', className }: HudStatChipProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-3 rounded-lg bg-surface-700/80 border border-white/10 min-w-[80px]',
        variant === 'kills' && 'border-neon-red/30',
        variant === 'wins' && 'border-neon-green/30',
        variant === 'points' && 'border-neon-yellow/30',
        className,
      )}
    >
      {icon && <div className="mb-1 text-white/40 text-xs">{icon}</div>}
      <div
        className={cn(
          'font-orbitron font-black text-xl leading-none',
          variant === 'kills' && 'text-neon-red',
          variant === 'wins' && 'text-neon-green',
          variant === 'points' && 'text-yellow-400',
          variant === 'default' && 'text-white',
        )}
      >
        {value}
      </div>
      <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
