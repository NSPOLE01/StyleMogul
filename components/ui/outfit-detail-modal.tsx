'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import StyleTag from './style-tag';
import ColorSwatch from './color-swatch';
import type { Outfit } from '@/lib/supabase';

interface OutfitDetailModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OutfitDetailModal({
  outfit,
  isOpen,
  onClose,
}: OutfitDetailModalProps) {
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
