'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  value: number; // 0–100
  max?: number;
  color?: 'red' | 'blue' | 'green' | 'yellow';
  label?: string;
  showPercent?: boolean;
  className?: string;
}

const colorMap = {
  red: 'bg-neon-red shadow-neon',
  blue: 'bg-neon-blue shadow-neon-blue',
  green: 'bg-neon-green shadow-neon-green',
  yellow: 'bg-yellow-400',
};

export function AnimatedProgressBar({
  value,
  max = 100,
  color = 'red',
  label,
  showPercent = false,
  className,
}: AnimatedProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>}
          {showPercent && <span className="text-xs font-orbitron text-white/70">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full bg-surface-600 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
