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
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
    primary: 'bg-primary-100 text-primary-700 hover:bg-primary-200',
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
