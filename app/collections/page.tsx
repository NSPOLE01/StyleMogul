'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import CreateCollectionModal from '@/components/ui/create-collection-modal';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';

interface Collection {
  id: string;
  name: string;
  created_at: string;
}

export default function CollectionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchCollections();
    }
  }, [user, loading, router]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      setLoadingCollections(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleCreateCollection = async (name: string) => {
    if (!user) return;

    const supabase = getSupabase();
    const { error } = await supabase.from('collections').insert({
      user_id: user.id,
      name,
    });

    if (error) throw error;

    // Refresh collections
    await fetchCollections();
  };

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

          {/* Collections Grid or Empty State */}
          {loadingCollections ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : collections.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-neutral-600 dark:text-neutral-300">
                  {collections.length} collection{collections.length === 1 ? '' : 's'}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary-500 dark:bg-primary-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                >
                  + New Collection
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Created {new Date(collection.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
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
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-8 bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
              >
                Create Your First Collection
              </button>
            </div>
          )}
        </div>

        {/* Create Collection Modal */}
        <CreateCollectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateCollection}
        />
      </main>
    </ProtectedRoute>
  );
}
