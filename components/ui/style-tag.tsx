interface StyleTagProps {
  label: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'primary';
}

export default function StyleTag({ label, size = 'md', variant = 'default' }: StyleTagProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const variantClasses = {
    default: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600',
    primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/60',
  };

  return (
    <span
      className={`
        inline-block rounded-full font-medium transition-colors
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
    >
      {label}
    </span>
  );
}
