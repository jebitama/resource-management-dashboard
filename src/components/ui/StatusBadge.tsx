/**
 * Status Badge Component
 * Displays resource status with semantic colors and optional pulse animation.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { ResourceStatusType } from '@/types';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: ResourceStatusType;
  size?: 'sm' | 'md';
}

const statusStyles: Record<ResourceStatusType, string> = {
  ACTIVE: 'bg-success/15 text-success border-success/30',
  IDLE: 'bg-bg-muted text-text-muted border-border',
  OVERLOADED: 'bg-destructive/15 text-destructive border-destructive/30',
  MAINTENANCE: 'bg-warning/15 text-warning border-warning/30',
  DECOMMISSIONED: 'bg-bg-muted text-text-muted border-border opacity-60',
};

/**
 * React.memo: Status badges are rendered for every row in the data table.
 * Since status values change infrequently, memoization prevents thousands
 * of unnecessary re-renders when the table re-sorts or re-filters.
 */
export const StatusBadge = memo(function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        statusStyles[status],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {status === 'ACTIVE' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
      )}
      {status === 'OVERLOADED' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
      )}
      {t(`status.${status}`)}
    </span>
  );
});
