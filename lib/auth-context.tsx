'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from './supabase';
import { AuthUser, getCurrentUser, syncUserProfile } from './auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    getCurrentUser()
      .then((user) => {
        setUser(user);
        setLoading(false);

        // Sync profile to database in the background (don't await)
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
        if (session?.user) {
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
        } else {
          setUser(null);
        }
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

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
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
