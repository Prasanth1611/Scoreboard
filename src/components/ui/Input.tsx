import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-muted">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 bg-surface-2 border border-default rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${className}`}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-muted">{label}</label>}
      <select
        className={`w-full px-4 py-2.5 bg-surface-2 border border-default rounded-lg text-[var(--color-text)] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
