'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from './supabase';
import { AuthUser, getCurrentUser, syncUserProfile } from './auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage (always up-to-date since we update it when profile changes)
    getCurrentUser()
      .then((user) => {
        setUser(user);
        setLoading(false);

        // Sync profile to database in the background
        if (user) {
          syncUserProfile(user.id, user.email, {
            full_name: user.full_name,
            avatar_url: user.avatar_url
          });
        }
      })
      .catch((error) => {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update on sign in/sign out events, not on token refresh
        if (event === 'SIGNED_IN' && session?.user) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);

          // Sync profile in background
          if (currentUser) {
            syncUserProfile(
              currentUser.id,
              currentUser.email,
              session.user.user_metadata
            );
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        // Ignore TOKEN_REFRESHED events to prevent overwriting manual refreshes
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleRefreshUser = async () => {
    if (!user) return;

    try {
      const supabase = getSupabase();

      // Fetch fresh profile data from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUser({
          id: user.id,
          email: user.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refreshUser: handleRefreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
