'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import StyleTag from './style-tag';
import ColorSwatch from './color-swatch';
import type { Outfit } from '@/lib/supabase';

interface OutfitDetailModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (outfitId: string) => void;
}

export default function OutfitDetailModal({
  outfit,
  isOpen,
  onClose,
  onDelete,
}: OutfitDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !outfit) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-lg"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Left: Image */}
            <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700 rounded-2xl overflow-hidden">
              <Image
                src={outfit.image_url}
                alt="Outfit"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Right: Details */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  Outfit Details
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Uploaded on {new Date(outfit.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Description */}
              {outfit.description && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Description
                  </h3>
                  <p className="text-neutral-900 dark:text-white leading-relaxed">
                    {outfit.description}
                  </p>
                </div>
              )}

              {/* Style Tags */}
              {outfit.style_tags && outfit.style_tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Style Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {outfit.style_tags.map((tag) => (
                      <StyleTag key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {outfit.categories && outfit.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {outfit.categories.map((category) => (
                      <StyleTag key={category} label={category} variant="primary" />
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {outfit.colors && outfit.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Colors
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {outfit.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <ColorSwatch color={color} size="lg" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Button */}
              {onDelete && (
                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Delete Outfit
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center">
                        Are you sure you want to delete this outfit? This action cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onDelete(outfit.id);
                            setShowDeleteConfirm(false);
                            onClose();
                          }}
                          className="flex-1 px-4 py-3 rounded-2xl bg-red-600 dark:bg-red-700 text-white font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
