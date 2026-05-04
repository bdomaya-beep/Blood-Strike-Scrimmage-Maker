import * as React from 'react';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function NeonButton({
  variant = 'primary',
  size = 'md',
  glow = true,
  className,
  children,
  ...props
}: NeonButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center font-orbitron font-bold uppercase tracking-wider rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-red/50 disabled:opacity-40 disabled:pointer-events-none select-none',
        {
          'bg-gradient-to-r from-neon-red to-neon-orange text-white hover:opacity-90': variant === 'primary',
          [glow && variant === 'primary' ? 'shadow-neon hover:shadow-[0_0_15px_theme("colors.neon.red"),0_0_40px_theme("colors.neon.red")]' : '']: true,
          'border border-neon-red/50 text-neon-red bg-neon-red/10 hover:bg-neon-red/20': variant === 'secondary',
          'text-white/60 hover:text-white hover:bg-white/10': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'text-xs px-3 py-1.5': size === 'sm',
          'text-sm px-5 py-2.5': size === 'md',
          'text-base px-7 py-3.5': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
