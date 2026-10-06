/**
 * Auth context: tracks the Supabase session, the user's profile (for the admin
 * role), and exposes sign-in / sign-up / sign-out / reset helpers. The session
 * persists in AsyncStorage, so the provider resolves an initial session on
 * mount and then listens for auth state changes.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/config";
import type { Profile } from "@/lib/types";

interface AuthState {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await loadProfile(data.session.user.id));
      }
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setProfile(
          newSession?.user ? await loadProfile(newSession.user.id) : null,
        );
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      session,
      profile,
      isAdmin: profile?.role === "admin",

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error?.message ?? null };
      },

      async signUp(fullName, email, password) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${SITE_URL}/auth/callback`,
          },
        });
        if (error) return { error: error.message, needsConfirmation: false };
        // If email confirmation is on, there's no active session yet.
        const needsConfirmation = !data.session;
        return { error: null, needsConfirmation };
      },

      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${SITE_URL}/auth/callback?next=/reset-password` },
        );
        return { error: error?.message ?? null };
      },

      async signOut() {
        await supabase.auth.signOut();
      },

      async refreshProfile() {
        if (session?.user) setProfile(await loadProfile(session.user.id));
      },
    }),
    [initializing, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
