import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { measureTelemetry, recordTelemetry } from '@/lib/telemetry';

export type AuthProfile = {
  id: string;
  authUserId: string | null;
  email: string | null;
  fullName: string;
  role: string;
  companyId: string | null;
  organizationId: string | null;
  title: string | null;
  accessScope: string;
  phone: string | null;
  avatarUrl: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<AuthProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_SNAPSHOT_STORAGE_KEY = 'vcontent.auth.session-snapshot';

function readSessionSnapshot(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeSessionSnapshot(session: Session | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.localStorage.removeItem(AUTH_SNAPSHOT_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_SNAPSHOT_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore local persistence issues. Supabase storage remains the primary source.
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadProfile(session: Session | null): Promise<AuthProfile | null> {
  if (!supabase || !session?.user) return null;
  const metadata = session.user.user_metadata || {};

  const { data, error } = await supabase
    .from('vcontent_profiles')
    .select('id,email,full_name,role,company_id,organization_id,title,access_scope,auth_user_id')
    .eq('auth_user_id', session.user.id)
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    authUserId: data.auth_user_id || session.user.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    companyId: data.company_id,
    organizationId: data.organization_id,
    title: data.title,
    accessScope: data.access_scope,
    phone: typeof metadata.phone === 'string' ? metadata.phone : null,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
  };
}

async function trySelfLinkProfile(session: Session | null): Promise<boolean> {
  if (!session?.access_token || !session.user?.email) return false;
  try {
    const response = await fetch('/api/self-link-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: session.user.email,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(() => readSessionSnapshot());
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const profileRef = useRef<AuthProfile | null>(null);
  const authEventVersionRef = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
    writeSessionSnapshot(session);
  }, [session]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let active = true;
    const bootstrap = async () => {
      const bootstrapVersion = authEventVersionRef.current;
      const persistedSnapshot = readSessionSnapshot();
      recordTelemetry('auth.bootstrap.requested');
      try {
        const result = await measureTelemetry(
          'auth.bootstrap.get_session',
          {},
          () =>
            withTimeout(
              client.auth.getSession(),
              8000,
              { data: { session: persistedSnapshot ?? sessionRef.current }, error: null },
            ),
        );
        if (!active) return;
        if (authEventVersionRef.current !== bootstrapVersion) {
          recordTelemetry('auth.bootstrap.ignored_stale_result');
          return;
        }
        if (result.error) {
          recordTelemetry('auth.bootstrap.error', { message: result.error.message });
          setSession(persistedSnapshot);
          setProfile(null);
          setLoading(false);
          return;
        }
        const resolvedSession = result.data.session ?? persistedSnapshot;
        setSession(resolvedSession);
        try {
          let nextProfile = await measureTelemetry(
            'auth.bootstrap.load_profile',
            { has_session: Boolean(resolvedSession) },
            () => withTimeout(loadProfile(resolvedSession), 8000, null),
          );
          if (!nextProfile && resolvedSession?.user?.email) {
            const linked = await measureTelemetry(
              'auth.bootstrap.self_link_profile',
              {},
              () => withTimeout(trySelfLinkProfile(resolvedSession), 8000, false),
            );
            if (linked) {
              nextProfile = await measureTelemetry(
                'auth.bootstrap.reload_profile',
                {},
                () => withTimeout(loadProfile(resolvedSession), 8000, null),
              );
            }
          }
          if (active && authEventVersionRef.current === bootstrapVersion) setProfile(nextProfile);
        } catch {
          if (active && authEventVersionRef.current === bootstrapVersion) setProfile(null);
        } finally {
          if (active && authEventVersionRef.current === bootstrapVersion) setLoading(false);
        }
      } catch {
        if (!active) return;
        if (authEventVersionRef.current !== bootstrapVersion) {
          recordTelemetry('auth.bootstrap.failed_stale_result');
          return;
        }
        recordTelemetry('auth.bootstrap.failed');
        setSession(persistedSnapshot);
        setProfile(null);
        setLoading(false);
      }
    };

    void bootstrap();

    const { data: subscription } = client.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return;
      authEventVersionRef.current += 1;
      const eventVersion = authEventVersionRef.current;
      recordTelemetry('auth.state_change.received', {
        event,
        event_version: eventVersion,
        has_session: Boolean(nextSession),
      });

      if (!nextSession) {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const result = await measureTelemetry(
            'auth.state_change.recover_session',
            { event },
            () =>
              withTimeout(
                client.auth.getSession(),
                8000,
                { data: { session: readSessionSnapshot() ?? sessionRef.current }, error: null },
              ),
          );
          if (!active) return;
          if (authEventVersionRef.current !== eventVersion) return;

          const resolvedSession = result.error ? sessionRef.current : result.data.session;
          setSession(resolvedSession);
          if (!resolvedSession) {
            setProfile(null);
            setLoading(false);
            return;
          }

          let nextProfile = await measureTelemetry(
            'auth.state_change.load_profile',
            { event },
            () => withTimeout(loadProfile(resolvedSession), 8000, profileRef.current),
          );
          if (!nextProfile && resolvedSession.user?.email) {
            const linked = await measureTelemetry(
              'auth.state_change.self_link_profile',
              { event },
              () => withTimeout(trySelfLinkProfile(resolvedSession), 8000, false),
            );
            if (linked) {
              nextProfile = await measureTelemetry(
                'auth.state_change.reload_profile',
                { event },
                () => withTimeout(loadProfile(resolvedSession), 8000, profileRef.current),
              );
            }
          }
          if (active && authEventVersionRef.current === eventVersion) setProfile(nextProfile);
        } catch {
          if (active && authEventVersionRef.current === eventVersion) {
            setSession((current) => current);
            setProfile((current) => current);
          }
        } finally {
          if (active && authEventVersionRef.current === eventVersion) setLoading(false);
        }
        return;
      }

      setLoading(true);
      setSession(nextSession);
      try {
        let nextProfile = await measureTelemetry(
          'auth.state_change.next_profile',
          { event },
          () => withTimeout(loadProfile(nextSession), 8000, null),
        );
        if (!nextProfile && nextSession.user?.email) {
          const linked = await measureTelemetry(
            'auth.state_change.next_self_link_profile',
            { event },
            () => withTimeout(trySelfLinkProfile(nextSession), 8000, false),
          );
          if (linked) {
            nextProfile = await measureTelemetry(
              'auth.state_change.next_reload_profile',
              { event },
              () => withTimeout(loadProfile(nextSession), 8000, null),
            );
          }
        }
        if (active && authEventVersionRef.current === eventVersion) setProfile(nextProfile);
      } catch {
        if (active && authEventVersionRef.current === eventVersion) setProfile(null);
      } finally {
        if (active && authEventVersionRef.current === eventVersion) setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      signIn: async (email, password) => {
        if (!supabase) throw new Error('Supabase client is not configured.');
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          sessionRef.current = data.session;
          setSession(data.session);
        }
      },
      signOut: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      refreshProfile: async () => {
        const nextProfile = await loadProfile(session);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
