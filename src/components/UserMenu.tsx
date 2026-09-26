import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Eye, LogOut, ChevronDown } from 'lucide-react';

export function UserMenu() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const displayName = profile.full_name || profile.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isAdmin ? 'bg-primary/20 text-primary-light' : 'bg-emerald-500/20 text-accent'
        }`}>
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold leading-tight max-w-[120px] truncate">{displayName}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            {isAdmin ? <Shield size={10} /> : <Eye size={10} />}
            {isAdmin ? 'Admin' : 'Viewer'}
          </p>
        </div>
        <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-default rounded-xl shadow-2xl py-2 animate-fade-in z-50">
          <div className="px-4 py-2 border-b border-default">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-muted truncate">{profile.email}</p>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isAdmin ? 'bg-primary/15 text-primary-light' : 'bg-emerald-500/15 text-accent'
            }`}>
              {isAdmin ? <Shield size={11} /> : <Eye size={11} />}
              {isAdmin ? 'Admin' : 'Viewer'}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
