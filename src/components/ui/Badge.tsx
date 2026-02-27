/**
 * ==========================================================================
 * Badge — Reusable Label Primitive
 * ==========================================================================
 * Small labels for tags, categories, counts, and status indicators.
 * Supports multiple color variants and optional dot indicator.
 * ==========================================================================
 */

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const badgeVariants = {
  default: 'bg-bg-muted text-text-secondary border-border',
  primary: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary/15 text-secondary border-secondary/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
} as const;

export interface BadgeProps {
  variant?: keyof typeof badgeVariants;
  size?: 'sm' | 'md';
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'sm',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        badgeVariants[variant],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'destructive' && 'bg-destructive animate-pulse',
            variant === 'primary' && 'bg-primary',
            variant === 'default' && 'bg-text-muted',
          )}
        />
      )}
      {children}
    </span>
  );
}
