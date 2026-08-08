import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export function Input({ label, id, error, className, ...rest }: InputProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={error !== undefined ? `${id}-error` : undefined}
        className={[
          'rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
          error !== undefined ? 'border-danger-500' : 'border-gray-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error !== undefined && (
        <p id={`${id}-error`} className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
