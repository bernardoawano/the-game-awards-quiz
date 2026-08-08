interface BadgeProps {
  variant: 'success' | 'neutral';
  children: React.ReactNode;
}

const STYLES: Record<'success' | 'neutral', string> = {
  success: 'bg-success-500/10 text-success-600',
  neutral: 'bg-gray-100 text-gray-700',
};

export function Badge({ variant, children }: BadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[variant]}`}
    >
      {variant === 'success' && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
          <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" />
        </svg>
      )}
      {children}
    </span>
  );
}
