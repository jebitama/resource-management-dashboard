/**
 * ==========================================================================
 * Button — Reusable UI Primitive
 * ==========================================================================
 * Flexible button with multiple variants, sizes, and states.
 * Composable with icons, loading spinners, and Framer Motion.
 * All props are strictly typed with no `any` usage.
 * ==========================================================================
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ---------- Variant Styles ----------

const variantStyles = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground hover:opacity-90 shadow-sm',
  destructive:
    'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm',
  outline:
    'border border-border bg-transparent text-text-primary hover:bg-bg-muted',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-muted hover:text-text-primary',
  link:
    'bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto',
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
} as const;

// ---------- Types ----------

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// ---------- Component ----------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  }
);
