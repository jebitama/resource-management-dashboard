/**
 * ==========================================================================
 * EmptyState — Reusable Feedback Component
 * ==========================================================================
 * Displayed when a list, search, or data fetch returns no results.
 * Composable with custom icons, descriptions, and action buttons.
 * ==========================================================================
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-muted text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-text-secondary">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant ?? 'primary'}
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
