interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<string, string> = {
  // Basic colors
  red: '#ef4444',
  pink: '#ec4899',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
  brown: '#92400e',
  gray: '#6b7280',
  grey: '#6b7280',
  black: '#000000',
  white: '#ffffff',

  // Extended colors
  beige: '#d4c5b9',
  navy: '#1e3a8a',
  cream: '#fef3c7',
  burgundy: '#7f1d1d',
  olive: '#6b7028',
  teal: '#14b8a6',
  lavender: '#c4b5fd',
  coral: '#fb7185',

  // Denim
  denim: '#5b92e5',

  // Multi-word
  'light blue': '#bfdbfe',
  'dark blue': '#1e3a8a',
  'light pink': '#fbcfe8',
  'hot pink': '#db2777',
  'forest green': '#15803d',
  'army green': '#4d7c0f',
};

export default function ColorSwatch({ color, size = 'md' }: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  // Try to find color in map or use as hex/rgb
  const colorValue = colorMap[color.toLowerCase()] || color;

  return (
    <div className="relative group inline-block">
      <div
        className={`
          rounded-full border-2 border-neutral-200 dark:border-neutral-600 hover:scale-110 transition-transform cursor-pointer
          ${sizeClasses[size]}
        `}
        style={{ backgroundColor: colorValue }}
        aria-label={`Color: ${color}`}
      />

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
        {color}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-700"></div>
        </div>
      </div>
    </div>
  );
}
