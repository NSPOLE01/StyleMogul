import Image from 'next/image';
import Link from 'next/link';
import StyleTag from './style-tag';
import ColorSwatch from './color-swatch';

interface OutfitCardProps {
  id: string;
  imageUrl: string;
  styleTags: string[];
  colors: string[];
  description?: string;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

export default function OutfitCard({
  id,
  imageUrl,
  styleTags,
  colors,
  description,
  onClick,
  onDelete,
}: OutfitCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from firing
    if (onDelete && confirm('Are you sure you want to delete this outfit?')) {
      onDelete(id);
    }
  };
  const cardContent = (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700">
        <Image
          src={imageUrl}
          alt="Outfit"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Delete Button - Top Left */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors z-10"
            aria-label="Delete outfit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Style Tags */}
        {styleTags && styleTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {styleTags.slice(0, 3).map((tag) => (
              <StyleTag key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Colors */}
        {colors && colors.length > 0 && (
          <div className="flex gap-2">
            {colors.slice(0, 5).map((color, i) => (
              <ColorSwatch key={i} color={color} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return <Link href={`/outfits/${id}`}>{cardContent}</Link>;
}
