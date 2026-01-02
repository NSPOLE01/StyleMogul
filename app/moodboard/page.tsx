'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import OutfitCard from '@/components/ui/outfit-card';
import ItemCard from '@/components/ui/item-card';
import OutfitDetailModal from '@/components/ui/outfit-detail-modal';
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

interface RecommendedItem {
  id: string;
  brand: string;
  name: string;
  category: string;
  price_range: string;
  image_url: string;
  description: string;
  style_tags: string[];
  similarity: number;
}

export default function MoodboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'outfits' | 'items' | 'recommended'>('outfits');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOutfits();
    }
  }, [user]);

  useEffect(() => {
    // Fetch recommended items when outfits are loaded
    if (outfits.length > 0) {
      fetchRecommendedItems();
    }
  }, [outfits]);

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

  const fetchRecommendedItems = async () => {
    if (outfits.length === 0) return;

    try {
      setLoadingRecommended(true);

      const supabase = getSupabase();

      // Use the most recent outfit's embedding for recommendations
      const mostRecentOutfit = outfits[0];

      if (!mostRecentOutfit.embedding) {
        console.warn('Most recent outfit has no embedding');
        return;
      }

      // Call the find_similar_items RPC function
      const { data, error: rpcError } = await supabase.rpc('find_similar_items', {
        query_embedding: mostRecentOutfit.embedding,
        match_threshold: 0.5,
        match_count: 12,
      });

      if (rpcError) {
        console.error('Error fetching recommendations:', rpcError);
        // Fall back to showing all items if vector search fails
        const { data: fallbackData } = await supabase
          .from('items')
          .select('*')
          .eq('in_stock', true)
          .limit(12);

        setRecommendedItems(fallbackData || []);
        return;
      }

      setRecommendedItems(data || []);
    } catch (err) {
      console.error('Error fetching recommended items:', err);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const handleOutfitClick = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Wait for modal animation before clearing selected outfit
    setTimeout(() => setSelectedOutfit(null), 200);
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
              className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${activeTab === 'outfits'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              My Outfits ({loading ? '...' : outfits.length})
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${activeTab === 'items'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              Saved Items ({mockSavedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${activeTab === 'recommended'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              Recommended
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
                    onClick={() => handleOutfitClick(outfit)}
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
          ) : activeTab === 'items' ? (
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
          ) : (
            // Recommended Items Tab
            loadingRecommended ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-neutral-600 dark:text-neutral-300">Finding items you'll love...</p>
              </div>
            ) : recommendedItems.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                    Based on your most recent outfit, we found {recommendedItems.length} items you might like
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recommendedItems.map((item) => (
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
              </>
            ) : outfits.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Personalized Recommendations
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                  Upload an outfit to get AI-powered recommendations
                </p>
                <Link
                  href="/upload"
                  className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                >
                  Upload an Outfit
                </Link>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  No recommendations available
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                  We couldn't find any matching items right now. Try uploading more outfits!
                </p>
              </div>
            )
          )}
        </div>

        {/* Outfit Detail Modal */}
        <OutfitDetailModal
          outfit={selectedOutfit}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </main>
    </ProtectedRoute>
  );
}
