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
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Fetch profile data (maybeSingle returns null if not found, doesn't throw)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // If profile doesn't exist, create it
  if (!profile) {
    console.log('Profile not found, creating...');

    // Get avatar from Google OAuth metadata (if available)
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: avatarUrl,
      });

    if (insertError) {
      console.error('Failed to create profile:', insertError);
    }
  }

  // Update avatar if user has Google photo but profile doesn't
  if (profile && !profile.avatar_url) {
    const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (googleAvatar) {
      console.log('Updating profile with Google avatar...');
      await supabase
        .from('profiles')
        .update({ avatar_url: googleAvatar })
        .eq('id', user.id);
    }
  }

  return {
    id: user.id,
    email: user.email!,
    full_name: profile?.full_name || user.user_metadata?.full_name,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
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
