'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [showAddView, setShowAddView] = useState(false);
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddView) setShowAddView(false);
        else onClose();
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
  }, [isOpen, showAddView, onClose]);

  useEffect(() => {
    if (isOpen && collection) {
      setShowAddView(false);
      fetchCollectionOutfits();
    }
  }, [isOpen, collection]);

  const fetchCollectionOutfits = async () => {
    if (!collection) return;
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('collection_outfits')
        .select(`outfit_id, outfits (*)`)
        .eq('collection_id', collection.id);
      if (error) throw error;
      setOutfits((data?.map(item => item.outfits).filter(Boolean) || []) as Outfit[]);
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

  const handleOpenAddView = async () => {
    await fetchAllOutfits();
    setSelectedOutfitIds(new Set());
    setShowAddView(true);
  };

  const toggleOutfitSelection = (outfitId: string) => {
    setSelectedOutfitIds(prev => {
      const next = new Set(prev);
      next.has(outfitId) ? next.delete(outfitId) : next.add(outfitId);
      return next;
    });
  };

  const handleAddOutfits = async () => {
    if (!collection || selectedOutfitIds.size === 0) return;
    try {
      const supabase = getSupabase();
      const inserts = Array.from(selectedOutfitIds).map(outfitId => ({
        collection_id: collection.id,
        outfit_id: outfitId,
      }));
      const { error } = await supabase.from('collection_outfits').insert(inserts);
      if (error) throw error;
      await fetchCollectionOutfits();
      setShowAddView(false);
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
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
    } catch (error) {
      console.error('Error removing outfit from collection:', error);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!collection) return;
    setUploading(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (data.outfitId) {
        const { error } = await supabase
          .from('collection_outfits')
          .insert({ collection_id: collection.id, outfit_id: data.outfitId });
        if (!error) {
          await fetchCollectionOutfits();
          // Refresh available outfits list so the uploaded one disappears from the grid
          await fetchAllOutfits();
        }
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen || !collection) return null;

  const availableOutfits = allOutfits.filter(
    o => !outfits.some(existing => existing.id === o.id)
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => showAddView ? setShowAddView(false) : onClose()}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUploadPhoto(file);
            }}
          />

          {/* Header */}
          <div className="flex items-center gap-4 p-8 pb-0">
            {showAddView && (
              <button
                onClick={() => setShowAddView(false)}
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors shrink-0"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {showAddView ? `Add photos to ${collection.name}` : collection.name}
              </h2>
              {!showAddView && (
                <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                  {outfits.length} outfit{outfits.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
            {!showAddView && outfits.length > 0 && (
              <button
                onClick={handleOpenAddView}
                className="shrink-0 bg-primary-500 dark:bg-primary-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
              >
                + Add photos
              </button>
            )}
            <button
              onClick={onClose}
              className="shrink-0 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8">
            {/* ── Collection view ── */}
            {!showAddView && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
                  </div>
                ) : outfits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="text-6xl">📸</div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                      No photos yet
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
                      Add your favourite outfits to this collection
                    </p>
                    <button
                      onClick={handleOpenAddView}
                      className="mt-2 bg-primary-500 dark:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                    >
                      Add photos to collection
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {outfits.map(outfit => (
                      <div key={outfit.id} className="relative group">
                        <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700 rounded-2xl overflow-hidden">
                          <Image
                            src={outfit.image_url}
                            alt="Outfit"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <button
                            onClick={() => handleRemoveOutfit(outfit.id)}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors z-10 opacity-0 group-hover:opacity-100"
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
                )}
              </>
            )}

            {/* ── Add photos view ── */}
            {showAddView && (
              <>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6 -mt-2">
                  Select from your moodboard or upload a new photo
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                  {availableOutfits.map(outfit => (
                    <div
                      key={outfit.id}
                      onClick={() => toggleOutfitSelection(outfit.id)}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all ${
                        selectedOutfitIds.has(outfit.id)
                          ? 'ring-4 ring-primary-500 dark:ring-primary-400'
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

                  {/* Upload tile */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="relative aspect-[3/4] border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Upload photo from desktop"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 text-center px-2">
                          Upload from computer
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-800 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setShowAddView(false)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOutfits}
                    disabled={selectedOutfitIds.size === 0}
                    className="flex-1 px-4 py-3 rounded-2xl bg-primary-500 dark:bg-primary-600 text-white font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedOutfitIds.size === 0
                      ? 'Add photos'
                      : `Add ${selectedOutfitIds.size} photo${selectedOutfitIds.size === 1 ? '' : 's'}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
