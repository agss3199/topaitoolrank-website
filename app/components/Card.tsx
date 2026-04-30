'use client';

import React from 'react';
import './Card.css';

type CardElement = React.ElementType;

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Content inside the card */
  children: React.ReactNode;
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Enable hover lift effect */
  hover?: boolean;
  /** HTML element tag (div, article, section, etc.) */
  as?: CardElement;
  /** CSS class name */
  className?: string;
}

/**
 * Card component for content containers.
 *
 * Used for form containers, content cards, post previews, and more.
 * Supports semantic HTML elements via the `as` prop.
 * Optional hover effect with shadow and border transition.
 *
 * @example
 * ```tsx
 * <Card padding="lg" hover>
 *   <h3>Post Title</h3>
 *   <p>Post preview...</p>
 * </Card>
 *
 * <Card as="article" padding="md">
 *   Article content
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLElement, CardProps>(
  ({
    children,
    padding = 'md',
    hover = false,
    as: Component = 'div',
    className = '',
    ...props
  }, ref) => {
    return (
      <Component
        ref={ref}
        className={`card card--padding-${padding} ${hover ? 'card--hover' : ''} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
