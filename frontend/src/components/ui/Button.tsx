import { cloneElement, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Spinner } from './Spinner';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES: Record<'primary' | 'secondary', string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  secondary: 'bg-surface-muted text-gray-900 border border-gray-300 hover:bg-gray-100',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  asChild = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps): React.ReactElement {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANT_STYLES[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      className: [classes, children.props.className].filter(Boolean).join(' '),
    });
  }

  return (
    <button type="button" disabled={disabled ?? isLoading} className={classes} {...rest}>
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
