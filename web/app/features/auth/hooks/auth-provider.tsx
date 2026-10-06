import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "~/shared/lib/supabase";
import { env } from "~/shared/lib/env";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

type AuthState = {
  status: "loading" | "signed-in" | "signed-out" | "domain-rejected";
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  rejectedEmail?: string;
};

type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function emailAllowed(email: string | null | undefined) {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`);
}

function toProfile(user: User | null): Profile | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      null,
    avatar_url: (meta.avatar_url as string | undefined) ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    session: null,
    profile: null,
  });

  const apply = (session: Session | null) => {
    const user = session?.user ?? null;
    if (!user) {
      setState({ status: "signed-out", user: null, session: null, profile: null });
      return;
    }
    if (!emailAllowed(user.email)) {
      // sign them out; we'll surface a message
      getSupabase().auth.signOut();
      setState({
        status: "domain-rejected",
        user: null,
        session: null,
        profile: null,
        rejectedEmail: user.email ?? undefined,
      });
      return;
    }
    setState({
      status: "signed-in",
      user,
      session,
      profile: toProfile(user),
    });
  };

  const refresh = async () => {
    const { data } = await getSupabase().auth.getSession();
    apply(data.session ?? null);
  };

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      apply(data.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
