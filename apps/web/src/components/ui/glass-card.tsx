import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'red' | 'blue' | 'green' | 'none';
  noBorder?: boolean;
}

export function GlassCard({ accent = 'none', noBorder = false, className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative bg-surface-800/80 backdrop-blur-md rounded-xl shadow-glass',
        !noBorder && 'border border-white/10',
        accent === 'red' && 'border-t-neon-red/60',
        accent === 'blue' && 'border-t-neon-blue/60',
        accent === 'green' && 'border-t-neon-green/60',
        className,
      )}
      {...props}
    >
      {accent !== 'none' && (
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-px rounded-t-xl',
            accent === 'red' && 'bg-gradient-to-r from-transparent via-neon-red to-transparent',
            accent === 'blue' && 'bg-gradient-to-r from-transparent via-neon-blue to-transparent',
            accent === 'green' && 'bg-gradient-to-r from-transparent via-neon-green to-transparent',
          )}
        />
      )}
      {children}
    </div>
  );
}
