/**
 * System Health Ticker
 * Displays real-time system metrics in the header.
 * Values animate smoothly using Framer Motion.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketData } from '@/hooks/useSocketData';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/utils';

interface MetricPillProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

/**
 * React.memo prevents unnecessary re-renders of individual metric pills
 * when other pills update. Since the ticker updates frequently (every 2s),
 * this optimization reduces DOM thrashing significantly.
 */
const MetricPill = memo(function MetricPill({ label, value, trend, color }: MetricPillProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-bg-muted/50 px-2 py-1">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('text-xs font-semibold tabular-nums', color)}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {trend && trend !== 'stable' && (
        <span className={cn('text-[10px]', trend === 'up' ? 'text-destructive' : 'text-success')}>
          {trend === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
});

export function SystemHealthTicker() {
  const { healthData, status } = useSocketData({ interval: 2500 });

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
        <span className="text-xs text-text-muted">Connecting...</span>
      </div>
    );
  }

  if (!healthData) return null;

  const cpuColor =
    healthData.cpuAvg > 80
      ? 'text-destructive'
      : healthData.cpuAvg > 60
        ? 'text-warning'
        : 'text-success';

  const memColor =
    healthData.memoryAvg > 80
      ? 'text-destructive'
      : healthData.memoryAvg > 60
        ? 'text-warning'
        : 'text-success';

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <div className="flex items-center gap-1.5">
        <div className={cn(
          'h-2 w-2 rounded-full',
          status === 'connected' ? 'bg-success animate-pulse' : 'bg-destructive'
        )} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Live
        </span>
      </div>
      <div className="h-4 w-px bg-border" />
      <MetricPill label="CPU" value={formatPercentage(healthData.cpuAvg)} color={cpuColor} />
      <MetricPill label="MEM" value={formatPercentage(healthData.memoryAvg)} color={memColor} />
      <MetricPill
        label="NET↓"
        value={`${healthData.networkIn.toFixed(0)} MB/s`}
        trend="stable"
      />
      <MetricPill
        label="CONN"
        value={healthData.activeConnections.toLocaleString()}
        trend="stable"
      />
      <MetricPill
        label="ERR"
        value={`${healthData.errorRate}%`}
        color={healthData.errorRate > 1 ? 'text-destructive' : 'text-success'}
      />
    </div>
  );
}
