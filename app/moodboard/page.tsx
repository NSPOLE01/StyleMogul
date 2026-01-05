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
  const [savedItems, setSavedItems] = useState<RecommendedItem[]>([]);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingSavedItems, setLoadingSavedItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOutfits();
      fetchSavedItems();
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

      // Helper function to ensure embedding is an array
      const parseEmbedding = (embedding: any): number[] | null => {
        if (!embedding) return null;

        // If it's already an array, return it
        if (Array.isArray(embedding)) {
          return embedding;
        }

        // If it's a string, try to parse it
        if (typeof embedding === 'string') {
          try {
            // Remove brackets and split by comma
            const cleaned = embedding.replace(/[\[\]]/g, '');
            return cleaned.split(',').map(v => parseFloat(v.trim()));
          } catch (e) {
            console.error('Failed to parse embedding string:', e);
            return null;
          }
        }

        return null;
      };

      // Filter outfits that have embeddings and parse them
      const outfitsWithEmbeddings = outfits
        .map(outfit => ({
          ...outfit,
          parsedEmbedding: parseEmbedding(outfit.embedding)
        }))
        .filter(outfit => outfit.parsedEmbedding && outfit.parsedEmbedding.length > 0);

      if (outfitsWithEmbeddings.length === 0) {
        console.warn('No outfits have valid embeddings');
        setLoadingRecommended(false);
        return;
      }

      // Average all outfit embeddings to create a comprehensive style profile
      const embeddingDimension = outfitsWithEmbeddings[0].parsedEmbedding!.length;
      const averageEmbedding = new Array(embeddingDimension).fill(0);

      // Sum all embeddings
      outfitsWithEmbeddings.forEach(outfit => {
        outfit.parsedEmbedding!.forEach((value, index) => {
          averageEmbedding[index] += value;
        });
      });

      // Divide by number of outfits to get average
      const numOutfits = outfitsWithEmbeddings.length;
      for (let i = 0; i < embeddingDimension; i++) {
        averageEmbedding[i] /= numOutfits;
      }

      // Call the find_similar_items RPC function with the average embedding
      const { data, error: rpcError } = await supabase.rpc('find_similar_items', {
        query_embedding: averageEmbedding,
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

  const fetchSavedItems = async () => {
    if (!user) return;

    try {
      setLoadingSavedItems(true);
      const supabase = getSupabase();

      // Fetch saved items with full item details
      const { data: savedItemsData, error: fetchError } = await supabase
        .from('saved_items')
        .select(`
          id,
          item_id,
          created_at,
          items (
            id,
            brand,
            name,
            category,
            price_range,
            image_url,
            description,
            style_tags
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Extract item data and create saved items list
      const items = (savedItemsData || [])
        .map((saved: any) => saved.items)
        .filter((item: any) => item !== null);

      setSavedItems(items);

      // Track saved item IDs for quick lookup
      const itemIds = new Set(items.map((item: any) => item.id));
      setSavedItemIds(itemIds);
    } catch (err) {
      console.error('Error fetching saved items:', err);
    } finally {
      setLoadingSavedItems(false);
    }
  };

  const handleSaveItem = async (itemId: string) => {
    if (!user) return;

    const isSaved = savedItemIds.has(itemId);

    try {
      const supabase = getSupabase();

      if (isSaved) {
        // Unsave the item
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId);

        if (error) throw error;

        // Update local state
        setSavedItemIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        setSavedItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        // Save the item
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            item_id: itemId,
          });

        if (error) throw error;

        // Update local state
        setSavedItemIds(prev => new Set(prev).add(itemId));

        // Refresh saved items to get the full item data
        await fetchSavedItems();
      }
    } catch (err) {
      console.error('Error saving/unsaving item:', err);
      alert('Failed to save item. Please try again.');
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

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const supabase = getSupabase();

      // Delete the outfit from the database
      const { error: deleteError } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitId);

      if (deleteError) throw deleteError;

      // Update local state to remove the outfit
      setOutfits(prevOutfits => prevOutfits.filter(outfit => outfit.id !== outfitId));

      console.log('Outfit deleted successfully');

      // Recommendations will automatically refresh due to the useEffect watching outfits
    } catch (err) {
      console.error('Error deleting outfit:', err);
      alert('Failed to delete outfit. Please try again.');
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
              Saved Items ({loadingSavedItems ? '...' : savedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${activeTab === 'recommended'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              Recommended ({loadingRecommended ? '...' : recommendedItems.length})
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
                    onDelete={handleDeleteOutfit}
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
            loadingSavedItems ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-neutral-600 dark:text-neutral-300">Loading your saved items...</p>
              </div>
            ) : savedItems.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedItems.map((item) => (
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
                    isSaved={true}
                    onSave={handleSaveItem}
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
                  Heart items from the recommendations to save them here
                </p>
                <button
                  onClick={() => setActiveTab('recommended')}
                  className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                >
                  View Recommendations
                </button>
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
                    Based on your {outfits.length} outfit{outfits.length === 1 ? '' : 's'}, we found {recommendedItems.length} item{recommendedItems.length === 1 ? '' : 's'} you might like
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
                      similarity={item.similarity}
                      isSaved={savedItemIds.has(item.id)}
                      onSave={handleSaveItem}
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
                <button
                  onClick={fetchRecommendedItems}
                  className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                >
                  Refresh Recommendations
                </button>
              </div>
            )
          )}
        </div>

        {/* Outfit Detail Modal */}
        <OutfitDetailModal
          outfit={selectedOutfit}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onDelete={handleDeleteOutfit}
        />
      </main>
    </ProtectedRoute>
  );
}
