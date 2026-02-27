/**
 * ==========================================================================
 * Input — Reusable Form Primitive
 * ==========================================================================
 * Text input with support for left/right addons, error states, and labels.
 * Uses forwardRef for form library compatibility (react-hook-form, etc).
 * ==========================================================================
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      inputSize = 'md',
      className,
      id,
      ...props
    },
    ref
  ) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const sizeClasses = {
      sm: 'h-8 text-xs',
      md: 'h-9 text-sm',
      lg: 'h-10 text-sm',
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-bg-input text-text-primary',
              'placeholder:text-text-muted',
              'focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring',
              'transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-destructive focus:border-destructive focus:ring-destructive/50'
                : 'border-border',
              sizeClasses[inputSize],
              leftAddon ? 'pl-9' : 'pl-3',
              rightAddon ? 'pr-9' : 'pr-3',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {rightAddon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-[11px] text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-[11px] text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
