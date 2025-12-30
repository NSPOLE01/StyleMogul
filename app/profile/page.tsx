'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabase();

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-soft p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Your Profile
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300">
              Manage your account information
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded-2xl ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Email cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                placeholder="Your name"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                placeholder="https://example.com/avatar.jpg"
              />
              {avatarUrl && (
                <div className="mt-3">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Preview:</p>
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 dark:bg-primary-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Account Stats */}
          <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-2xl p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Account ID</p>
                <p className="text-xs font-mono text-neutral-900 dark:text-white truncate">
                  {user.id}
                </p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-2xl p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Member Since</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Recently
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
