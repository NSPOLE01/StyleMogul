'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import OutfitCard from '@/components/ui/outfit-card';
import ItemCard from '@/components/ui/item-card';
import OutfitDetailModal from '@/components/ui/outfit-detail-modal';
import ItemDetailModal from '@/components/ui/item-detail-modal';
import ColorSwatch from '@/components/ui/color-swatch';
import StyleTag from '@/components/ui/style-tag';
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
  colors: string[];
  product_url?: string;
  similarity: number;
}

export default function MoodboardPage() {
  const { user } = useAuth();
  const filterRef = useRef<HTMLDivElement>(null);
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
  const [selectedItem, setSelectedItem] = useState<RecommendedItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [topColors, setTopColors] = useState<{ color: string; count: number }[]>([]);
  const [topStyles, setTopStyles] = useState<{ style: string; count: number }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    styles: string[];
    colors: string[];
    prices: string[];
    categories: string[];
  }>({
    styles: [],
    colors: [],
    prices: [],
    categories: [],
  });

  useEffect(() => {
    if (user) {
      fetchOutfits();
      fetchSavedItems();
    }
  }, [user]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    // Fetch recommended items when outfits are loaded
    if (outfits.length > 0) {
      fetchRecommendedItems();
      analyzeOutfits();
    }
  }, [outfits]);

  const getUniqueFilterValues = () => {
    const allStyles = new Set<string>();
    const allColors = new Set<string>();
    const allPrices = new Set<string>();
    const allCategories = new Set<string>();

    recommendedItems.forEach(item => {
      item.style_tags?.forEach(tag => allStyles.add(tag));
      item.colors?.forEach(color => allColors.add(color));
      if (item.price_range) allPrices.add(item.price_range);
      if (item.category) allCategories.add(item.category);
    });

    return {
      styles: Array.from(allStyles).sort(),
      colors: Array.from(allColors).sort(),
      prices: Array.from(allPrices).sort(),
      categories: Array.from(allCategories).sort(),
    };
  };

  const toggleFilter = (type: 'styles' | 'colors' | 'prices' | 'categories', value: string) => {
    setSelectedFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      styles: [],
      colors: [],
      prices: [],
      categories: [],
    });
  };

  const filteredRecommendedItems = recommendedItems.filter(item => {
    // If no filters selected, show all items
    const hasActiveFilters =
      selectedFilters.styles.length > 0 ||
      selectedFilters.colors.length > 0 ||
      selectedFilters.prices.length > 0 ||
      selectedFilters.categories.length > 0;

    if (!hasActiveFilters) return true;

    // Check if item matches all selected filter categories
    const matchesStyle = selectedFilters.styles.length === 0 ||
      item.style_tags?.some(tag => selectedFilters.styles.includes(tag));

    const matchesColor = selectedFilters.colors.length === 0 ||
      item.colors?.some(color => selectedFilters.colors.includes(color));

    const matchesPrice = selectedFilters.prices.length === 0 ||
      selectedFilters.prices.includes(item.price_range);

    const matchesCategory = selectedFilters.categories.length === 0 ||
      selectedFilters.categories.includes(item.category);

    return matchesStyle && matchesColor && matchesPrice && matchesCategory;
  });

  const analyzeOutfits = () => {
    if (outfits.length === 0) {
      setTopColors([]);
      setTopStyles([]);
      return;
    }

    // Count colors
    const colorCounts: Record<string, number> = {};
    outfits.forEach(outfit => {
      outfit.colors?.forEach(color => {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      });
    });

    // Count style tags
    const styleCounts: Record<string, number> = {};
    outfits.forEach(outfit => {
      outfit.style_tags?.forEach(tag => {
        styleCounts[tag] = (styleCounts[tag] || 0) + 1;
      });
    });

    // Sort and get top 5 colors
    const sortedColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color, count]) => ({ color, count }));

    // Sort and get top 5 styles
    const sortedStyles = Object.entries(styleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([style, count]) => ({ style, count }));

    setTopColors(sortedColors);
    setTopStyles(sortedStyles);
  };

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
            style_tags,
            colors,
            product_url
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

  const handleItemClick = (item: RecommendedItem) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    // Wait for modal animation before clearing selected item
    setTimeout(() => setSelectedItem(null), 200);
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

          {/* Top Colors and Styles */}
          {outfits.length > 0 && (topColors.length > 0 || topStyles.length > 0) && (
            <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-soft mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                Top Colors and Styles
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Top Colors */}
                {topColors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                      Most Used Colors
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {topColors.map(({ color, count }) => (
                        <div key={color} className="flex items-center gap-3">
                          <ColorSwatch color={color} size="lg" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                              {color}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {count} {count === 1 ? 'outfit' : 'outfits'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Styles */}
                {topStyles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                      Most Used Styles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {topStyles.map(({ style, count }) => (
                        <div key={style} className="flex items-center gap-2">
                          <StyleTag label={style} variant="primary" />
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            ×{count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                    colors={item.colors}
                    isSaved={true}
                    onSave={handleSaveItem}
                    onClick={() => handleItemClick(item)}
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
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                    Based on your {outfits.length} outfit{outfits.length === 1 ? '' : 's'}, we found {filteredRecommendedItems.length} item{filteredRecommendedItems.length === 1 ? '' : 's'} you might like
                  </p>
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                      {(selectedFilters.styles.length + selectedFilters.colors.length + selectedFilters.prices.length + selectedFilters.categories.length) > 0 && (
                        <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {selectedFilters.styles.length + selectedFilters.colors.length + selectedFilters.prices.length + selectedFilters.categories.length}
                        </span>
                      )}
                    </button>

                    {/* Filter Dropdown */}
                    {showFilters && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-700 p-4 z-10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">Filters</h3>
                          <button
                            onClick={clearAllFilters}
                            className="text-xs text-primary-500 dark:text-primary-400 hover:underline"
                          >
                            Clear all
                          </button>
                        </div>

                        {/* Style Filter */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Style</h4>
                          <div className="flex flex-wrap gap-2">
                            {getUniqueFilterValues().styles.map(style => (
                              <button
                                key={style}
                                onClick={() => toggleFilter('styles', style)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  selectedFilters.styles.includes(style)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color Filter */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Color</h4>
                          <div className="flex flex-wrap gap-2">
                            {getUniqueFilterValues().colors.map(color => (
                              <button
                                key={color}
                                onClick={() => toggleFilter('colors', color)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                                  selectedFilters.colors.includes(color)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                }`}
                              >
                                {color}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Price Filter */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Price</h4>
                          <div className="flex flex-wrap gap-2">
                            {getUniqueFilterValues().prices.map(price => (
                              <button
                                key={price}
                                onClick={() => toggleFilter('prices', price)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  selectedFilters.prices.includes(price)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                }`}
                              >
                                {price}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Category</h4>
                          <div className="flex flex-wrap gap-2">
                            {getUniqueFilterValues().categories.map(category => (
                              <button
                                key={category}
                                onClick={() => toggleFilter('categories', category)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                                  selectedFilters.categories.includes(category)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {filteredRecommendedItems.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecommendedItems.map((item) => (
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
                        colors={item.colors}
                        similarity={item.similarity}
                        isSaved={savedItemIds.has(item.id)}
                        onSave={handleSaveItem}
                        onClick={() => handleItemClick(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                      No items match your filters
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                      Try adjusting or clearing your filters
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="inline-block bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
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

        {/* Item Detail Modal */}
        <ItemDetailModal
          item={selectedItem}
          isOpen={isItemModalOpen}
          onClose={handleCloseItemModal}
          isSaved={selectedItem ? savedItemIds.has(selectedItem.id) : false}
          onSave={handleSaveItem}
        />
      </main>
    </ProtectedRoute>
  );
}
