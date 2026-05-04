import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export function Button({
  variant = 'default',
  size = 'md',
  asChild = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-red/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
    {
      'bg-gradient-to-r from-neon-red to-neon-orange text-white hover:opacity-90 font-orbitron font-bold': variant === 'default',
      'border border-white/20 text-white/70 bg-transparent hover:border-neon-red/50 hover:text-neon-red hover:bg-neon-red/10': variant === 'outline',
      'text-white/60 hover:text-white hover:bg-white/10 bg-transparent': variant === 'ghost',
      'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
      'text-xs px-3 py-1.5': size === 'sm',
      'text-sm px-5 py-2.5': size === 'md',
      'text-base px-7 py-3.5': size === 'lg',
    },
    className,
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      ...props,
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
