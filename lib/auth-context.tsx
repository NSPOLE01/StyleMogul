'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from './supabase';
import { AuthUser, getCurrentUser } from './auth';

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
    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing completion');
      setLoading(false);
    }, 3000);

    // Check active sessions and sets the user
    getCurrentUser()
      .then((user) => {
        clearTimeout(timeout);
        console.log('Auth loaded:', user ? 'User found' : 'No user');
        setUser(user);
        setLoading(false);
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.error('Auth error:', error);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setUser(null);
        } finally {
          setLoading(false);
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
