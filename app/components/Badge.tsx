'use client';

import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge variant/status type */
  variant?: 'sent' | 'unsent' | 'failed' | 'pending' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Badge content */
  children: React.ReactNode;
  /** CSS class name */
  className?: string;
}

/**
 * Badge component for status indicators.
 *
 * Displays status with color-coded background, text, and icon.
 * Used in WA Sender for message statuses (sent, failed, pending, etc).
 *
 * Variants:
 * - `sent`/`success`: Green, checkmark icon
 * - `unsent`/`neutral`: Gray, circle icon
 * - `failed`/`error`: Red, X icon
 * - `pending`/`warning`: Yellow, spinner icon
 * - `info`: Blue, info icon
 *
 * @example
 * ```tsx
 * <Badge variant="sent">Sent</Badge>
 * <Badge variant="pending">Processing...</Badge>
 * <Badge variant="failed">Failed</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  ...props
}) => {
  // Normalize variant aliases
  const normalizedVariant = variant === 'sent' ? 'success' :
                           variant === 'unsent' ? 'neutral' :
                           variant === 'failed' ? 'error' :
                           variant === 'pending' ? 'warning' :
                           variant;

  const getIcon = (v: string) => {
    switch (v) {
      case 'success':
        return (
          <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        );
      case 'warning':
        return (
          <span className="badge-spinner" aria-hidden="true" />
        );
      case 'info':
        return (
          <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'neutral':
      default:
        return (
          <span className="badge-circle" aria-hidden="true" />
        );
    }
  };

  return (
    <span
      className={`badge badge--${normalizedVariant} ${className}`}
      {...props}
    >
      {getIcon(normalizedVariant)}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
