import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trophy, Shield, Eye, Loader2, Wand2, Copy, Check } from 'lucide-react';

function generatePassword(): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = lower + upper + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  let pw = [pick(lower), pick(upper), pick(digits), pick(symbols)];
  for (let i = 4; i < 14; i++) pw.push(pick(all));
  return pw.sort(() => Math.random() - 0.5).join('');
}

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let pts = 0;
  if (pw.length >= 8) pts++;
  if (pw.length >= 12) pts++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) pts++;
  if (/[0-9]/.test(pw)) pts++;
  if (/[^a-zA-Z0-9]/.test(pw)) pts++;
  const score = Math.min(4, Math.floor(pts * 4 / 5)) as 0 | 1 | 2 | 3 | 4;
  const map = {
    0: { label: 'Very weak', color: 'bg-red-500' },
    1: { label: 'Weak', color: 'bg-orange-500' },
    2: { label: 'Fair', color: 'bg-amber-500' },
    3: { label: 'Good', color: 'bg-lime-500' },
    4: { label: 'Strong', color: 'bg-emerald-500' },
  };
  return { score, ...map[score] };
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestedPw, setSuggestedPw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pwStrength = useMemo(() => scorePassword(password), [password]);

  const handleSuggest = useCallback(() => {
    const pw = generatePassword();
    setSuggestedPw(pw);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!suggestedPw) return;
    navigator.clipboard.writeText(suggestedPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [suggestedPw]);

  const handleUseSuggested = useCallback(() => {
    if (!suggestedPw) return;
    setPassword(suggestedPw);
    setSuggestedPw(null);
  }, [suggestedPw]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    if (mode === 'signup' && !fullName.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setBusy(true);
    if (mode === 'signin') {
      const { error: err } = await signIn(email.trim(), password);
      if (err) setError(err);
    } else {
      const { error: err } = await signUp(email.trim(), password, fullName.trim(), role);
      if (err) setError(err);
    }
    setBusy(false);
  }, [mode, email, password, fullName, role, signIn, signUp]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-blue-600/30 mx-auto mb-4">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Scoreboard</h1>
          <p className="text-sm text-muted mt-1">Tournament Management Platform</p>
        </div>

        <div className="bg-surface border border-default rounded-2xl p-6 shadow-2xl">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-surface-2 rounded-xl mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-primary text-white shadow-lg shadow-blue-600/20' : 'text-muted hover:text-[var(--color-text)]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-primary text-white shadow-lg shadow-blue-600/20' : 'text-muted hover:text-[var(--color-text)]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={mode === 'signin'}
            />
            <div className="space-y-2">
              <Input
                label={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === 'signup' && (
                <>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i <= pwStrength.score ? pwStrength.color : 'bg-surface-2'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-muted w-16 text-right">{pwStrength.label}</span>
                    </div>
                  )}

                  {/* Suggestion button */}
                  <button
                    type="button"
                    onClick={handleSuggest}
                    className="flex items-center gap-1.5 text-xs text-primary-light hover:text-primary transition-colors font-medium"
                  >
                    <Wand2 size={13} /> Suggest a strong password
                  </button>

                  {/* Suggested password display */}
                  {suggestedPw && (
                    <div className="bg-surface-2 border border-default rounded-lg p-3 animate-fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-sm font-mono text-accent break-all flex-1">{suggestedPw}</code>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-surface transition-colors"
                            title="Copy"
                          >
                            {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} className="text-muted" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleUseSuggested}
                            className="px-2 py-1 rounded-md bg-primary/15 text-primary-light text-xs font-semibold hover:bg-primary/25 transition-colors"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted mt-1.5">Copy this password or click Use to fill it in. Save it somewhere safe — you'll need it to sign in.</p>
                    </div>
                  )}

                  {/* Requirements hint */}
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-warning flex items-center gap-1">
                      Use at least 8 characters with a mix of letters, numbers, and symbols.
                    </p>
                  )}
                </>
              )}
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-muted">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`flex flex-col items-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      role === 'viewer'
                        ? 'border-accent bg-emerald-500/10'
                        : 'border-default bg-surface-2 hover:border-[var(--color-text-muted)]'
                    }`}
                  >
                    <Eye size={20} className={role === 'viewer' ? 'text-accent' : 'text-muted'} />
                    <span className={`text-sm font-semibold ${role === 'viewer' ? 'text-accent' : 'text-muted'}`}>Viewer</span>
                    <span className="text-[10px] text-muted px-2 text-center leading-tight">Watch live scoreboards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex flex-col items-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      role === 'admin'
                        ? 'border-primary bg-blue-500/10'
                        : 'border-default bg-surface-2 hover:border-[var(--color-text-muted)]'
                    }`}
                  >
                    <Shield size={20} className={role === 'admin' ? 'text-primary-light' : 'text-muted'} />
                    <span className={`text-sm font-semibold ${role === 'admin' ? 'text-primary-light' : 'text-muted'}`}>Admin</span>
                    <span className="text-[10px] text-muted px-2 text-center leading-tight">Manage tournaments</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-error">
                {error}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full" size="lg">
              {busy ? (
                <><Loader2 size={18} className="animate-spin" /> {mode === 'signin' ? 'Signing in...' : 'Creating account...'}</>
              ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-muted text-center mt-4">
              Choose Viewer to watch live scoreboards, or Admin to create and manage tournaments.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
