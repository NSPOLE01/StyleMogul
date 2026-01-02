'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import OutfitCard from '@/components/ui/outfit-card';
import ItemCard from '@/components/ui/item-card';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Outfit } from '@/lib/supabase';

const mockSavedItems = [
  {
    id: '1',
    brand: 'Everlane',
    name: 'Organic Cotton Tee',
    category: 'tops',
    price_range: '$',
    image_url: 'https://placehold.co/400x500/f5f5f4/a8a29e?text=Organic+Tee',
    description: 'Classic minimalist tee in organic cotton',
    style_tags: ['minimalist', 'casual', 'basics'],
  },
  {
    id: '2',
    brand: 'Reformation',
    name: 'Vintage Floral Dress',
    category: 'dresses',
    price_range: '$$',
    image_url: 'https://placehold.co/400x500/fce8e6/e35e52?text=Floral+Dress',
    description: 'Sustainable floral midi dress',
    style_tags: ['vintage', 'bohemian'],
  },
];

export default function MoodboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'outfits' | 'items'>('outfits');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOutfits();
    }
  }, [user]);

  const fetchOutfits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOutfits(data || []);
    } catch (err) {
      console.error('Error fetching outfits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Your Moodboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            All your saved outfits and favorite items in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('outfits')}
            className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'outfits'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            My Outfits ({loading ? '...' : outfits.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'items'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Saved Items ({mockSavedItems.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'outfits' ? (
          loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-300">Loading your outfits...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Error loading outfits
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">{error}</p>
              <button
                onClick={fetchOutfits}
                className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : outfits.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {outfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  id={outfit.id}
                  imageUrl={outfit.image_url}
                  styleTags={outfit.style_tags}
                  colors={outfit.colors}
                  description={outfit.description}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                No outfits yet
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                Upload your first outfit to get started
              </p>
              <Link
                href="/upload"
                className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
              >
                Upload Outfit
              </Link>
            </div>
          )
        ) : (
          mockSavedItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockSavedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  brand={item.brand}
                  name={item.name}
                  category={item.category}
                  priceRange={item.price_range}
                  imageUrl={item.image_url}
                  description={item.description}
                  styleTags={item.style_tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                No saved items yet
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                Upload an outfit to discover items you'll love
              </p>
              <Link
                href="/upload"
                className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
              >
                Start Discovering
              </Link>
            </div>
          )
        )}
      </div>
    </main>
    </ProtectedRoute>
  );
}
