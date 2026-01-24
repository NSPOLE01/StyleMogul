'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';

export default function CollectionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
          <Navigation />
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Collections
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300">
              Organize your style inspirations into curated collections
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft text-center max-w-3xl mx-auto">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Curate Your Style
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6 leading-relaxed">
              Group your uploaded photos into specific collections to further curate your moodboard.
              Create collections for different occasions, seasons, or style aesthetics to keep your
              inspiration organized and easily accessible.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-2xl p-4">
                <div className="text-3xl mb-2">🌸</div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                  By Season
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Spring, Summer, Fall, Winter
                </p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-2xl p-4">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                  By Occasion
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Work, Casual, Events
                </p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-2xl p-4">
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                  By Aesthetic
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Minimalist, Vintage, Modern
                </p>
              </div>
            </div>
            <button className="mt-8 bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors">
              Create Your First Collection
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
