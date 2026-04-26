import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logAudit = async (payload: Record<string, unknown>) => {
    try {
      await supabase.functions.invoke('log-audit-event', { body: payload });
    } catch (e) {
      console.warn('audit log failed', e);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    await logAudit({
      action: 'signup',
      status: error ? 'failed' : 'success',
      user_id: data?.user?.id ?? null,
      user_email: email,
      user_name: name,
      error_message: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    await logAudit({
      action: error ? 'login_failed' : 'login',
      status: error ? 'failed' : 'success',
      user_id: data?.user?.id ?? null,
      user_email: email,
      error_message: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const currentUser = user;
    await supabase.auth.signOut();
    await logAudit({
      action: 'logout',
      status: 'success',
      user_id: currentUser?.id ?? null,
      user_email: currentUser?.email ?? null,
    });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    await logAudit({
      action: 'password_reset',
      status: error ? 'failed' : 'success',
      user_email: email,
      error_message: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
