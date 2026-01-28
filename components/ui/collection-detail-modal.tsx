'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';
import type { Outfit } from '@/lib/supabase';

interface CollectionDetailModalProps {
  collection: {
    id: string;
    name: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function CollectionDetailModal({
  collection,
  isOpen,
  onClose,
  userId,
}: CollectionDetailModalProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) {
          setShowAddModal(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showAddModal, onClose]);

  useEffect(() => {
    if (isOpen && collection) {
      fetchCollectionOutfits();
    }
  }, [isOpen, collection]);

  const fetchCollectionOutfits = async () => {
    if (!collection) return;

    try {
      setLoading(true);
      const supabase = getSupabase();

      // Fetch outfits in this collection
      const { data, error } = await supabase
        .from('collection_outfits')
        .select(`
          outfit_id,
          outfits (*)
        `)
        .eq('collection_id', collection.id);

      if (error) throw error;

      const outfitData = data?.map(item => item.outfits).filter(Boolean) || [];
      setOutfits(outfitData as Outfit[]);
    } catch (error) {
      console.error('Error fetching collection outfits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOutfits = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllOutfits(data || []);
    } catch (error) {
      console.error('Error fetching all outfits:', error);
    }
  };

  const handleOpenAddModal = async () => {
    await fetchAllOutfits();
    setSelectedOutfitIds(new Set());
    setShowAddModal(true);
  };

  const toggleOutfitSelection = (outfitId: string) => {
    setSelectedOutfitIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(outfitId)) {
        newSet.delete(outfitId);
      } else {
        newSet.add(outfitId);
      }
      return newSet;
    });
  };

  const handleAddOutfits = async () => {
    if (!collection || selectedOutfitIds.size === 0) return;

    try {
      const supabase = getSupabase();

      // Add selected outfits to collection
      const inserts = Array.from(selectedOutfitIds).map(outfitId => ({
        collection_id: collection.id,
        outfit_id: outfitId,
      }));

      const { error } = await supabase
        .from('collection_outfits')
        .insert(inserts);

      if (error) throw error;

      // Refresh collection outfits
      await fetchCollectionOutfits();
      setShowAddModal(false);
      setSelectedOutfitIds(new Set());
    } catch (error) {
      console.error('Error adding outfits to collection:', error);
    }
  };

  const handleRemoveOutfit = async (outfitId: string) => {
    if (!collection) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('collection_outfits')
        .delete()
        .eq('collection_id', collection.id)
        .eq('outfit_id', outfitId);

      if (error) throw error;

      // Update local state
      setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
    } catch (error) {
      console.error('Error removing outfit from collection:', error);
    }
  };

  if (!isOpen || !collection) return null;

  // Filter out outfits already in the collection
  const availableOutfits = allOutfits.filter(
    outfit => !outfits.some(existing => existing.id === outfit.id)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => showAddModal ? setShowAddModal(false) : onClose()}
      />

      {/* Main Modal */}
      {!showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                    {collection.name}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    {outfits.length} outfit{outfits.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-primary-500 dark:bg-primary-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                >
                  + Add Photos
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                </div>
              ) : outfits.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {outfits.map((outfit) => (
                    <div key={outfit.id} className="relative group">
                      <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700 rounded-2xl overflow-hidden">
                        <Image
                          src={outfit.image_url}
                          alt="Outfit"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveOutfit(outfit.id)}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors z-10"
                          aria-label="Remove from collection"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    No photos in this collection yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                    Start adding your favorite outfits to this collection
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                  >
                    Add Photos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Add Photos Modal */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Add Photos to {collection.name}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                Select photos from your uploaded outfits
              </p>

              {availableOutfits.length > 0 ? (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                    {availableOutfits.map((outfit) => (
                      <div
                        key={outfit.id}
                        onClick={() => toggleOutfitSelection(outfit.id)}
                        className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all ${
                          selectedOutfitIds.has(outfit.id)
                            ? 'ring-4 ring-primary-500 dark:ring-primary-600'
                            : 'hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-600'
                        }`}
                      >
                        <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700">
                          <Image
                            src={outfit.image_url}
                            alt="Outfit"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          {selectedOutfitIds.has(outfit.id) && (
                            <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-800 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddOutfits}
                      disabled={selectedOutfitIds.size === 0}
                      className="flex-1 px-4 py-3 rounded-2xl bg-primary-500 dark:bg-primary-600 text-white font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add {selectedOutfitIds.size} Photo{selectedOutfitIds.size === 1 ? '' : 's'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    All photos are already in this collection
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                    Upload more outfits to add them to your collections
                  </p>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
