import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variants = {
    primary: 'bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40',
    secondary: 'bg-surface-2 hover:bg-[#222a3d] text-[var(--color-text)] border border-default',
    ghost: 'text-muted hover:text-[var(--color-text)] hover:bg-surface-2',
    danger: 'bg-error hover:bg-red-600 text-white shadow-lg shadow-red-600/20',
    accent: 'bg-accent hover:bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
