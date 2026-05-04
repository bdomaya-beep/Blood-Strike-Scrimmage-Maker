'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScorePulseCellProps {
  value: number | string;
  flash?: boolean;
  className?: string;
}

export function ScorePulseCell({ value, flash = false, className }: ScorePulseCellProps) {
  const [animating, setAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setAnimating(true);
      prevValue.current = value;
      const timer = setTimeout(() => setAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={cn(
        'inline-block font-orbitron font-bold tabular-nums transition-colors',
        (animating || flash) && 'animate-score-flash text-neon-green',
        className,
      )}
    >
      {value}
    </span>
  );
}
