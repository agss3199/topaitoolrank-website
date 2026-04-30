'use client';

import React from 'react';
import './Avatar.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL (optional) */
  src?: string;
  /** Alt text for image or aria-label for initials */
  alt: string;
  /** Full name for initials fallback */
  name: string;
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg';
  /** CSS class name */
  className?: string;
}

/**
 * Avatar component for displaying user images or initials.
 *
 * When `src` is provided, renders an image avatar.
 * When `src` is not provided, displays initials fallback.
 *
 * Sizes:
 * - `sm`: 32px
 * - `md`: 40px (default)
 * - `lg`: 56px
 *
 * @example
 * ```tsx
 * <Avatar src="/avatar.jpg" alt="John Doe" name="John Doe" />
 * <Avatar alt="Jane Smith" name="Jane Smith" />
 * ```
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({
    src,
    alt,
    name,
    size = 'md',
    className = '',
    ...props
  }, ref) => {
    // Extract initials from name
    const getInitials = (fullName: string): string => {
      return fullName
        .split(' ')
        .slice(0, 2)
        .map(word => word[0]?.toUpperCase())
        .join('')
        .slice(0, 2);
    };

    const initials = getInitials(name);

    return (
      <div
        ref={ref}
        className={`avatar avatar--${size} ${className}`}
        aria-label={!src ? name : undefined}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="avatar-image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
