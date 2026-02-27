/**
 * ==========================================================================
 * Live Feed View — Real-Time System Monitoring
 * ==========================================================================
 * Displays a live event log from the simulated WebSocket stream.
 * Events are color-coded by severity and auto-scroll to the latest entry.
 * Demonstrates real-time UI updates with Framer Motion list animations.
 * ==========================================================================
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSocketData } from '@/hooks/useSocketData';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/utils';
import type { SocketMessage } from '@/types';

// ---------- Severity Styles ----------

const severityStyles = {
  info: 'border-l-primary bg-primary/5',
  warning: 'border-l-warning bg-warning/5',
  error: 'border-l-destructive bg-destructive/5',
  critical: 'border-l-destructive bg-destructive/10',
} as const;

const severityDot = {
  info: 'bg-primary',
  warning: 'bg-warning',
  error: 'bg-destructive',
  critical: 'bg-destructive animate-pulse',
} as const;

// ---------- Message Card ----------

function MessageCard({ message }: { message: SocketMessage }) {
  switch (message.type) {
    case 'SYSTEM_HEALTH':
      return (
        <div className="flex items-center gap-4 rounded-lg border-l-2 border-l-success bg-success/5 p-3">
          <div className="h-2 w-2 rounded-full bg-success" />
          <div className="flex-1">
            <p className="text-xs font-medium text-text-primary">System Health Update</p>
            <p className="mt-0.5 text-[10px] text-text-secondary">
              CPU: {formatPercentage(message.payload.cpuAvg)} · 
              MEM: {formatPercentage(message.payload.memoryAvg)} · 
              Connections: {message.payload.activeConnections.toLocaleString()}
            </p>
          </div>
          <span className="text-[10px] text-text-muted tabular-nums">
            {new Date(message.payload.timestamp).toLocaleTimeString()}
          </span>
        </div>
      );

    case 'ALERT':
      return (
        <div className={cn(
          'flex items-start gap-3 rounded-lg border-l-2 p-3',
          severityStyles[message.payload.severity]
        )}>
          <div className={cn('mt-0.5 h-2 w-2 rounded-full', severityDot[message.payload.severity])} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-text-primary truncate">
                {message.payload.title}
              </p>
              <span className={cn(
                'flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                message.payload.severity === 'critical' && 'bg-destructive text-destructive-foreground',
                message.payload.severity === 'error' && 'bg-destructive/20 text-destructive',
                message.payload.severity === 'warning' && 'bg-warning/20 text-warning',
                message.payload.severity === 'info' && 'bg-primary/20 text-primary',
              )}>
                {message.payload.severity}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-text-secondary truncate">
              {message.payload.message}
            </p>
          </div>
          <span className="flex-shrink-0 text-[10px] text-text-muted tabular-nums">
            {new Date(message.payload.timestamp).toLocaleTimeString()}
          </span>
        </div>
      );

    case 'MARKET_TICKER': {
      const isPositive = message.payload.change >= 0;
      return (
        <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-accent bg-accent/5 p-3">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <div className="flex-1">
            <p className="text-xs font-medium text-text-primary">
              Resource Metric Update
            </p>
            <p className="mt-0.5 text-[10px] text-text-secondary">
              {message.payload.resourceId} · {message.payload.metric.toUpperCase()}: {message.payload.value.toFixed(1)}
              <span className={cn('ml-1 font-medium', isPositive ? 'text-destructive' : 'text-success')}>
                {isPositive ? '+' : ''}{message.payload.change.toFixed(2)}%
              </span>
            </p>
          </div>
          <span className="text-[10px] text-text-muted tabular-nums">
            {new Date(message.payload.timestamp).toLocaleTimeString()}
          </span>
        </div>
      );
    }

    case 'RESOURCE_UPDATE':
      return (
        <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-secondary bg-secondary/5 p-3">
          <div className="h-2 w-2 rounded-full bg-secondary" />
          <div className="flex-1">
            <p className="text-xs font-medium text-text-primary">
              Resource Configuration Change
            </p>
            <p className="mt-0.5 text-[10px] text-text-secondary">
              {message.payload.resourceId} · {String(message.payload.field)}: {String(message.payload.oldValue)} → {String(message.payload.newValue)}
            </p>
          </div>
          <span className="text-[10px] text-text-muted tabular-nums">
            {new Date(message.payload.timestamp).toLocaleTimeString()}
          </span>
        </div>
      );
  }
}

// ---------- Health Gauge ----------

function HealthGauge({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const color =
    percentage > 80 ? 'bg-destructive' : percentage > 60 ? 'bg-warning' : 'bg-success';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-text-primary">
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}

// ---------- Main View ----------

export function LiveFeedView() {
  const { t } = useTranslation();
  const { healthData, messageHistory, status } = useSocketData({
    interval: 1500,
    maxHistory: 100,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messageHistory.length]);

  /**
   * useMemo: Categorize messages by type for the stats counters.
   * Avoids re-counting on every render when only new messages arrive.
   */
  const stats = useMemo(() => {
    const alerts = messageHistory.filter((m) => m.type === 'ALERT');
    return {
      total: messageHistory.length,
      alerts: alerts.length,
      critical: alerts.filter(
        (m) => m.type === 'ALERT' && m.payload.severity === 'critical'
      ).length,
      health: messageHistory.filter((m) => m.type === 'SYSTEM_HEALTH').length,
    };
  }, [messageHistory]);

  const connectionLabel = useCallback((s: typeof status) => {
    switch (s) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col p-6"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('liveFeed.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('liveFeed.subtitle')}</p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left — System Health Panel */}
        <div className="space-y-4 lg:col-span-1">
          {/* Connection Status */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn(
                'h-2.5 w-2.5 rounded-full',
                status === 'connected' ? 'bg-success animate-pulse' : 'bg-destructive'
              )} />
              <span className="text-xs font-medium text-text-primary">
                {connectionLabel(status)}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold text-text-primary">{stats.total}</p>
                <p className="text-[10px] text-text-muted">Events</p>
              </div>
              <div className="rounded-lg bg-bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold text-warning">{stats.alerts}</p>
                <p className="text-[10px] text-text-muted">Alerts</p>
              </div>
              <div className="rounded-lg bg-bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold text-destructive">{stats.critical}</p>
                <p className="text-[10px] text-text-muted">Critical</p>
              </div>
              <div className="rounded-lg bg-bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold text-success">{stats.health}</p>
                <p className="text-[10px] text-text-muted">Health</p>
              </div>
            </div>
          </div>

          {/* Health Gauges */}
          {healthData && (
            <div className="glass-card space-y-4 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('liveFeed.systemHealth')}
              </h3>
              <HealthGauge label={t('liveFeed.cpu')} value={healthData.cpuAvg} />
              <HealthGauge label={t('liveFeed.memory')} value={healthData.memoryAvg} />
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-muted">{t('liveFeed.networkIn')}</span>
                  <span className="font-medium text-text-primary tabular-nums">{healthData.networkIn.toFixed(1)} MB/s</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-muted">{t('liveFeed.networkOut')}</span>
                  <span className="font-medium text-text-primary tabular-nums">{healthData.networkOut.toFixed(1)} MB/s</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-muted">{t('liveFeed.connections')}</span>
                  <span className="font-medium text-text-primary tabular-nums">{healthData.activeConnections.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-muted">{t('liveFeed.errorRate')}</span>
                  <span className={cn(
                    'font-medium tabular-nums',
                    healthData.errorRate > 1 ? 'text-destructive' : 'text-success'
                  )}>
                    {healthData.errorRate}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Event Log */}
        <div className="glass-card flex flex-col lg:col-span-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {t('liveFeed.eventLog')}
            </h3>
            <span className="tabular-nums text-[10px] text-text-muted">
              {stats.total} events
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
            <AnimatePresence initial={false}>
              {status === 'connecting' && messageHistory.length === 0 ? (
                <div className="space-y-4 py-2">
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                </div>
              ) : messageHistory.length === 0 ? (
                <p className="py-12 text-center text-sm text-text-muted">
                  {t('liveFeed.noEvents')}
                </p>
              ) : (
                messageHistory.map((msg, idx) => (
                  <motion.div
                    key={`${msg.type}-${idx}`}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <MessageCard message={msg} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
