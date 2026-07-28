import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shows a spinner and disables the button while true. */
  busy?: boolean;
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

export function Button({
  busy = false,
  variant = 'ghost',
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && <Spinner />}
      <span>{children}</span>
    </button>
  );
}
