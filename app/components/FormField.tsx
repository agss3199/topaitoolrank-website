'use client';

import React from 'react';
import { Label } from './Label';
import { Input, InputProps } from './Input';
import './FormField.css';

export interface FormFieldProps extends Omit<InputProps, 'label'> {
  /** Label text for the input */
  label: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Help text displayed below label (optional) */
  hint?: string;
}

/**
 * FormField component combining Label + Input + error message.
 *
 * Handles proper spacing and ARIA wiring automatically.
 * Use this instead of Label + Input separately for consistent forms.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email Address"
 *   type="email"
 *   id="email"
 *   name="email"
 *   required
 *   error={errors.email}
 *   hint="We'll never share your email"
 * />
 * ```
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    label,
    error,
    required = false,
    hint,
    id,
    name,
    type = 'text',
    disabled = false,
    placeholder,
    value,
    onChange,
    onBlur,
    autoComplete,
    className = '',
    ...props
  }, ref) => {
    return (
      <fieldset className={`form-field ${className}`}>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>

        {hint && (
          <span className="form-field-hint" id={`${id}-hint`}>
            {hint}
          </span>
        )}

        <Input
          ref={ref}
          id={id}
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          error={error}
          aria-describedby={hint ? `${id}-hint` : error ? `${id}-error` : undefined}
          {...props}
        />

        {error && (
          <span className="form-field-error" id={`${id}-error`} role="alert">
            {error}
          </span>
        )}
      </fieldset>
    );
  }
);

FormField.displayName = 'FormField';
