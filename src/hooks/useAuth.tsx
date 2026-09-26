import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, profile: null, loading: true });

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) { console.error('Error fetching profile:', error); return null; }
    return data as Profile | null;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        fetchProfile(session.user.id).then((profile) => {
          if (!mounted) return;
          setState({ session, profile, loading: false });
        });
      } else {
        setState({ session: null, profile: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          setState({ session: null, profile: null, loading: false });
          return;
        }
        const profile = await fetchProfile(session.user.id);
        if (!mounted) return;
        setState({ session, profile, loading: false });
      })();
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error) };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: friendlyAuthError(error) };
    if (!data.user) return { error: 'Sign-up failed. Please try again.' };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, profile: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function friendlyAuthError(error: { message: string; code?: string }): string {
  const msg = error.message;
  if (error.code === 'weak_password' || msg.includes('weak_password')) {
    return 'That password is too common or easy to guess. Please choose a stronger password (at least 8 characters, not a common word).';
  }
  if (error.code === 'invalid_credentials' || msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please double-check your credentials.';
  }
  if (error.code === 'unexpected_failure' || msg.includes('Database error saving new user')) {
    return 'Something went wrong while creating your account. Please try again with a different email or password.';
  }
  if (msg.includes('User already registered') || error.code === 'user_already_exists') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('Email rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return msg;
}
