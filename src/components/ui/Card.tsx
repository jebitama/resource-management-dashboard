/**
 * ==========================================================================
 * Card — Reusable Container Primitive
 * ==========================================================================
 * Semantic card component with header, content, and footer slots.
 * Uses the glass-card utility class for consistent styling across the app.
 * ==========================================================================
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ---------- Card Root ----------

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ghost' | 'bordered';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ variant = 'default', className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-shadow',
          variant === 'default' && 'glass-card',
          variant === 'ghost' && 'bg-transparent',
          variant === 'bordered' && 'border border-border bg-bg-card rounded-xl',
          className
        )}
        {...props}
      />
    );
  }
);

// ---------- Card Header ----------

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ action, className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between border-b border-border px-5 py-4',
          className
        )}
        {...props}
      >
        <div>{children}</div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);

// ---------- Card Title ----------

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn('text-sm font-semibold text-text-primary', className)}
      {...props}
    />
  );
});

// ---------- Card Description ----------

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn('mt-0.5 text-xs text-text-secondary', className)}
      {...props}
    />
  );
});

// ---------- Card Content ----------

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('p-5', className)}
      {...props}
    />
  );
});

// ---------- Card Footer ----------

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center border-t border-border px-5 py-3',
        className
      )}
      {...props}
    />
  );
});
