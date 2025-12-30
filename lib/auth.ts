import { getSupabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  // Create profile in profiles table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });

    if (profileError) console.error('Profile creation error:', profileError);
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current user - read directly from localStorage to bypass hanging getSession()
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Read session directly from localStorage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

    const sessionData = localStorage.getItem(storageKey);

    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    const user = session?.currentSession?.user || session?.user;

    if (!user) {
      return null;
    }

    // Return user data from session
    return {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Sync user profile to database - called separately after initial load
 */
export async function syncUserProfile(userId: string, email: string, metadata: any) {
  try {
    const supabase = getSupabase();

    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const avatarUrl = metadata?.avatar_url || metadata?.picture || null;
    const fullName = metadata?.full_name || null;

    if (!profile) {
      // Create profile
      await supabase.from('profiles').insert({
        id: userId,
        email: email,
        full_name: fullName,
        avatar_url: avatarUrl,
      });
    } else if (!profile.avatar_url && avatarUrl) {
      // Update avatar if missing
      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Profile sync error:', error);
  }
}

/**
 * Reset password request
 */
export async function resetPassword(email: string) {
  const supabase = getSupabase();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = getSupabase();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}
