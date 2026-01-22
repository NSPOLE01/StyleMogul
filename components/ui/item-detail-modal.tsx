'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import StyleTag from './style-tag';
import ColorSwatch from './color-swatch';

interface ItemDetailModalProps {
  item: {
    id: string;
    brand: string;
    name: string;
    category: string;
    price_range: string;
    image_url: string;
    description?: string;
    style_tags?: string[];
    colors?: string[];
    product_url?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onSave?: (itemId: string) => void;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  isSaved = false,
  onSave,
}: ItemDetailModalProps) {
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

  if (!isOpen || !item) return null;

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
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Right: Details */}
            <div className="flex flex-col gap-6">
              <div>
                {/* Brand & Category */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wide">
                    {item.brand}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 uppercase">
                    {item.category}
                  </p>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  {item.name}
                </h2>

                {/* Price */}
                <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-4">
                  {item.price_range}
                </p>
              </div>

              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Description
                  </h3>
                  <p className="text-neutral-900 dark:text-white leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Style Tags */}
              {item.style_tags && item.style_tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Style Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.style_tags.map((tag) => (
                      <StyleTag key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {item.colors && item.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Colors
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {item.colors.map((color, i) => (
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

              {/* Action Buttons */}
              <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700 flex gap-3">
                {/* Save/Unsave Button */}
                {onSave && (
                  <button
                    onClick={() => onSave(item.id)}
                    className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-colors ${
                      isSaved
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'bg-primary-500 dark:bg-primary-600 text-white hover:bg-primary-600 dark:hover:bg-primary-700'
                    }`}
                  >
                    {isSaved ? 'Remove from Saved' : 'Save Item'}
                  </button>
                )}

                {/* View Product Button */}
                {item.product_url && (
                  <a
                    href={item.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-center"
                  >
                    View Product
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
