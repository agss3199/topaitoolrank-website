import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Semantic button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional CSS classes */
  className?: string;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Button component implementing the design system.
 *
 * Supports multiple variants (primary, secondary, danger, ghost) and sizes.
 * Includes loading state with spinner, full accessibility support,
 * and respects prefers-reduced-motion preference.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="secondary" disabled>Disabled</Button>
 * <Button loading>Processing...</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    className = '',
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
        {...props}
      >
        {loading && (
          <span className="btn__spinner" aria-hidden="true">
            <span className="btn__spinner-dot" />
          </span>
        )}
        <span className={`btn__content ${loading ? 'btn__content--hidden' : ''}`}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
