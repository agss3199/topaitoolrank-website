'use client';

import React from 'react';
import './Label.css';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** HTML for attribute linking to input id */
  htmlFor: string;
  /** Label text content */
  children: React.ReactNode;
  /** Whether the associated input is required */
  required?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * Label component for form inputs.
 *
 * Always paired with an input via htmlFor attribute.
 * Uses design system colors and typography.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email" required>Email Address</Label>
 * <Input id="email" name="email" type="email" />
 * ```
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ htmlFor, children, required = false, className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={`label ${className}`}
        {...props}
      >
        {children}
        {required && <span className="label-required" aria-label="required">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';
