'use client';

import React, { useState } from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Input type: text, email, password */
  type?: 'text' | 'email' | 'password';
  /** Associated label text (use with FormField instead for proper spacing) */
  label?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Error message to display below the input */
  error?: string;
  /** Unique identifier for aria-describedby linking */
  id: string;
  /** Input name attribute */
  name: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Auto-complete type hint */
  autoComplete?: string;
  /** Current input value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** CSS class name */
  className?: string;
}

/**
 * Input component with accessibility features.
 *
 * Supports text, email, and password input types with full WCAG AAA compliance.
 * Includes optional label, error message handling, and password visibility toggle.
 *
 * **Note**: Use FormField wrapper for proper label + input + error spacing.
 *
 * @example
 * ```tsx
 * <Input
 *   id="email"
 *   name="email"
 *   type="email"
 *   placeholder="you@example.com"
 *   required
 *   error={errors.email}
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    type = 'text',
    label,
    required = false,
    error,
    id,
    name,
    placeholder,
    disabled = false,
    autoComplete,
    value,
    onChange,
    onBlur,
    className = '',
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const hasError = !!error;

    return (
      <div className={`input-wrapper ${className}`}>
        {label && (
          <label htmlFor={id} className="input-label">
            {label}
            {required && <span aria-label="required" className="input-required">*</span>}
          </label>
        )}

        <div className="input-container">
          <input
            ref={ref}
            id={id}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            required={required}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={hasError}
            className={`input ${hasError ? 'input--error' : ''}`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              className="input-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              tabIndex={0}
            >
              <svg
                className="input-toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>

        {error && (
          <span id={`${id}-error`} className="input-error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
