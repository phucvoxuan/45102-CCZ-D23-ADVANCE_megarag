'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/auth-client';
import { useRouter } from 'next/navigation';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
}

interface Subscription {
  plan_name: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Fetch user profile and subscription data with timeout
  const fetchUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setSubscription(null);
      return;
    }

    console.log('[AuthContext] Fetching user data for:', currentUser.id);

    try {
      // Try to fetch profile - may not exist for all users
      // Use maybeSingle() to avoid error when no row found
      // Add timeout to prevent hanging
      let profileData: UserProfile | null = null;
      let profileError: { message: string } | null = null;

      try {
        const profilePromise = supabase
          .from('profiles')
          .select('full_name, avatar_url, email, role')
          .eq('id', currentUser.id)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => {
            console.warn('[AuthContext] Profile query timeout');
            resolve({ data: null, error: { message: 'Timeout' } });
          }, 5000)
        );

        const result = await Promise.race([profilePromise, timeoutPromise]);
        profileData = result.data as UserProfile | null;
        profileError = result.error as { message: string } | null;
      } catch (e) {
        console.warn('[AuthContext] Profile query error:', e);
        profileError = { message: e instanceof Error ? e.message : 'Unknown error' };
      }

      if (profileError) {
        // Profile table might not exist or user doesn't have a profile
        // Fall back to user metadata from auth
        console.warn('[AuthContext] Profile fetch failed, using auth metadata:', profileError.message);
        setProfile({
          full_name: currentUser.user_metadata?.full_name || null,
          avatar_url: currentUser.user_metadata?.avatar_url || null,
          email: currentUser.email || null,
          role: null,
        });
      } else if (profileData) {
        setProfile(profileData);
      } else {
        // No profile exists, use auth metadata
        setProfile({
          full_name: currentUser.user_metadata?.full_name || null,
          avatar_url: currentUser.user_metadata?.avatar_url || null,
          email: currentUser.email || null,
          role: null,
        });
      }

      // Fetch subscription with timeout - use maybeSingle() to handle no subscription
      let subData: Subscription | null = null;
      let subError: { message: string } | null = null;

      try {
        const subPromise = supabase
          .from('subscriptions')
          .select('plan_name, status')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => {
            console.warn('[AuthContext] Subscription query timeout');
            resolve({ data: null, error: { message: 'Timeout' } });
          }, 5000)
        );

        const result = await Promise.race([subPromise, timeoutPromise]);
        subData = result.data as Subscription | null;
        subError = result.error as { message: string } | null;
      } catch (e) {
        console.warn('[AuthContext] Subscription query error:', e);
        subError = { message: e instanceof Error ? e.message : 'Unknown error' };
      }

      if (subError) {
        console.warn('[AuthContext] Subscription fetch failed:', subError.message);
        // Default to FREE plan
        setSubscription({ plan_name: 'FREE', status: 'active' });
      } else if (!subData) {
        // No subscription exists - default to FREE plan
        setSubscription({ plan_name: 'FREE', status: 'active' });
      } else {
        setSubscription(subData);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user data:', error);
      // Set default values on error
      setProfile({
        full_name: currentUser.user_metadata?.full_name || null,
        avatar_url: currentUser.user_metadata?.avatar_url || null,
        email: currentUser.email || null,
        role: null,
      });
      setSubscription({ plan_name: 'FREE', status: 'active' });
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  const refreshSession = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (currentSession?.user) {
      await fetchUserData(currentSession.user);
    }
  }, [supabase.auth, fetchUserData]);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        // Add timeout to auth requests - if they hang, treat as no session
        let cachedSession: Session | null = null;
        let currentUser: User | null = null;

        // Try getSession with timeout
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => {
              console.warn('[AuthContext] getSession timeout');
              resolve(null);
            }, 5000)
          );

          const result = await Promise.race([sessionPromise, timeoutPromise]);
          if (result && 'data' in result) {
            cachedSession = result.data.session;
          }
        } catch (e) {
          console.warn('[AuthContext] getSession error:', e);
        }

        if (cachedSession?.user && isMounted) {
          setSession(cachedSession);
          setUser(cachedSession.user);
          // Fetch additional data BEFORE setting loading to false
          // This prevents race condition where components see user but no subscription
          await fetchUserData(cachedSession.user);
          if (isMounted) setIsLoading(false);
        } else if (isMounted) {
          // No cached session or timeout, try getUser with timeout
          try {
            const userPromise = supabase.auth.getUser();
            const timeoutPromise = new Promise<null>((resolve) =>
              setTimeout(() => {
                console.warn('[AuthContext] getUser timeout');
                resolve(null);
              }, 5000)
            );

            const result = await Promise.race([userPromise, timeoutPromise]);
            if (result && 'data' in result) {
              currentUser = result.data.user;
            }
          } catch (e) {
            console.warn('[AuthContext] getUser error:', e);
          }

          if (isMounted) {
            setUser(currentUser);
            if (currentUser) {
              await fetchUserData(currentUser);
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error getting session:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession: Session | null) => {
      if (!isMounted) return;

      console.log('[AuthContext] Auth state changed:', event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData(currentSession.user);
      } else {
        setProfile(null);
        setSubscription(null);
      }

      setIsLoading(false);

      // Handle specific events
      if (event === 'SIGNED_OUT') {
        router.push('/');
      } else if (event === 'SIGNED_IN') {
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
    };
  }, [supabase.auth, router, fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    // Use window.location.href for full page reload to clear all state
    window.location.href = '/';
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        refreshSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
