interface AlertProps {
  variant: 'error' | 'success' | 'info';
  live?: 'assertive' | 'polite';
  children: React.ReactNode;
}

const ICONS: Record<'error' | 'success' | 'info', React.ReactElement> = {
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 13H9v-6h2v6zm0-8H9V5h2v2z" />
    </svg>
  ),
};

const STYLES: Record<'error' | 'success' | 'info', string> = {
  error: 'bg-danger-500/10 text-danger-600 border-danger-500/30',
  success: 'bg-success-500/10 text-success-600 border-success-500/30',
  info: 'bg-brand-500/10 text-brand-600 border-brand-500/30',
};

export function Alert({ variant, live = 'assertive', children }: AlertProps): React.ReactElement {
  return (
    <div
      role={live === 'polite' ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded border px-3 py-2 text-sm ${STYLES[variant]}`}
    >
      {ICONS[variant]}
      <span>{children}</span>
    </div>
  );
}
