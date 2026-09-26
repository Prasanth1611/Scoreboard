import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-surface-2 text-muted border-default',
    success: 'bg-emerald-500/15 text-accent border-emerald-500/30',
    warning: 'bg-amber-500/15 text-warning border-amber-500/30',
    error: 'bg-red-500/15 text-error border-red-500/30',
    info: 'bg-blue-500/15 text-primary-light border-blue-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
}
