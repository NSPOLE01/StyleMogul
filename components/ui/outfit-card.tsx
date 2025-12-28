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
}

export default function OutfitCard({
  id,
  imageUrl,
  styleTags,
  colors,
  description,
  onClick,
}: OutfitCardProps) {
  const cardContent = (
    <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-neutral-100">
        <Image
          src={imageUrl}
          alt="Outfit"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
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
          <p className="text-neutral-700 text-sm mb-3 line-clamp-2">
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
