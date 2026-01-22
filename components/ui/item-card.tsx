import Image from 'next/image';
import StyleTag from './style-tag';
import ColorSwatch from './color-swatch';

interface ItemCardProps {
  id: string;
  brand: string;
  name: string;
  category: string;
  priceRange: string;
  imageUrl: string;
  description?: string;
  styleTags?: string[];
  colors?: string[];
  similarity?: number;
  isSaved?: boolean;
  onSave?: (id: string) => void;
}

export default function ItemCard({
  id,
  brand,
  name,
  category,
  priceRange,
  imageUrl,
  description,
  styleTags,
  colors,
  similarity,
  isSaved = false,
  onSave,
}: ItemCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Save Button */}
        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(id);
            }}
            className={`absolute top-3 right-3 backdrop-blur-sm rounded-full p-2.5 transition-all hover:scale-110 shadow-soft ${
              isSaved
                ? 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700'
                : 'bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800'
            }`}
            aria-label={isSaved ? 'Unsave item' : 'Save item'}
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                isSaved ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
              }`}
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        {/* Match Percentage */}
        {similarity && (
          <div className="absolute top-3 left-3 bg-primary-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            {Math.round(similarity * 100)}% match
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand & Category */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wide">
            {brand}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">
            {category}
          </p>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
          {name}
        </h3>

        {/* Price Range */}
        <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-3">
          {priceRange}
        </p>

        {/* Colors */}
        {colors && colors.length > 0 && (
          <div className="flex gap-2 mb-3">
            {colors.slice(0, 5).map((color, i) => (
              <ColorSwatch key={i} color={color} />
            ))}
          </div>
        )}

        {/* Style Tags */}
        {styleTags && styleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {styleTags.slice(0, 3).map((tag) => (
              <StyleTag key={tag} label={tag} size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
