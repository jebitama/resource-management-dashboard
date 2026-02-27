/**
 * ==========================================================================
 * Skeleton — Loading State Primitive
 * ==========================================================================
 * Animated placeholder for content in loading states.
 * Shows a shimmer effect with Tailwind's animate-pulse.
 * Highly configurable for different shapes and sizes.
 * ==========================================================================
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  lines,
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse rounded bg-bg-muted',
              i === lines - 1 && 'w-3/4',
              className
            )}
            style={{ height: 14 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-bg-muted',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-3.5',
        variant === 'default' && 'rounded-lg',
        className
      )}
      style={style}
    />
  );
}

/**
 * Pre-composed skeleton for a metric card loading state.
 * Used in the DashboardView while data is being fetched.
 */
export function MetricCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton width={80} height={10} variant="text" />
          <Skeleton width={120} height={28} />
          <Skeleton width={100} height={10} variant="text" />
        </div>
        <Skeleton width={40} height={40} className="rounded-xl" />
      </div>
      <Skeleton width={140} height={10} variant="text" />
    </div>
  );
}

/**
 * Pre-composed skeleton for table row loading states.
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      <Skeleton width="22%" height={14} variant="text" />
      <Skeleton width="8%" height={20} className="rounded" />
      <Skeleton width="10%" height={20} className="rounded-full" />
      <Skeleton width="10%" height={14} variant="text" />
      <Skeleton width="8%" height={14} variant="text" />
      <Skeleton width="7%" height={14} variant="text" />
      <Skeleton width="7%" height={14} variant="text" />
      <Skeleton width="8%" height={14} variant="text" />
    </div>
  );
}
