/**
 * ==========================================================================
 * Dashboard View — GraphQL Analytics
 * ==========================================================================
 * Main dashboard displaying enterprise metrics, resource distribution,
 * and cost trends. Uses Apollo Client for data fetching and Framer Motion
 * for layout animations with shared layoutId transitions.
 * ==========================================================================
 */

import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { GET_DASHBOARD_METRICS } from '@/graphql/queries';
import type { GetDashboardMetricsQuery } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/utils';
import { MetricCardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useMemo } from 'react';

// ---------- Metric Card ----------

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

function MetricCard({ title, value, subtitle, icon, trend, color }: MetricCardProps) {
  return (
    <motion.div
      layout
      layoutId={`metric-${title}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {title}
          </p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            color
          )}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.isPositive ? 'text-success' : 'text-destructive'}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-text-muted">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

// ---------- Chart Colors ----------

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b'];

// ---------- Main View ----------

export function DashboardView() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery<GetDashboardMetricsQuery>(
    GET_DASHBOARD_METRICS,
    { pollInterval: 30000 } // Refresh every 30s
  );

  /**
   * useMemo: Avoids recalculating derived chart data on every render.
   * Since the query data only changes every 30s, this prevents unnecessary
   * processing of the cost trends array on unrelated re-renders.
   */
  const chartData = useMemo(
    () =>
      data?.costTrends.map((trend: { date: string; cost: number; projected: number }) => ({
        ...trend,
        date: new Date(trend.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      })) ?? [],
    [data?.costTrends]
  );

  if (loading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton width={200} height={32} />
          <Skeleton width={300} height={20} className="mt-2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-[340px] lg:col-span-2 glass-card" />
          <Skeleton className="h-[340px] glass-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm text-destructive">{t('common.error')}</p>
          <p className="text-xs text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  const metrics = data?.dashboardMetrics;
  if (!metrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('app.subtitle')}</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('dashboard.totalResources')}
          value={formatCompactNumber(metrics.totalResources)}
          subtitle={`${formatCompactNumber(metrics.activeResources)} ${t('common.active').toLowerCase()}`}
          icon={<svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>}
          color="bg-primary"
          trend={{ value: 12.5, isPositive: true }}
        />
        <MetricCard
          title={t('dashboard.avgCpu')}
          value={formatPercentage(metrics.avgCpuUtilization)}
          subtitle={`Memory: ${formatPercentage(metrics.avgMemoryUtilization)}`}
          icon={<svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>}
          color="bg-secondary"
          trend={{ value: 3.2, isPositive: false }}
        />
        <MetricCard
          title={t('dashboard.costPerHour')}
          value={formatCurrency(metrics.totalCostPerHour)}
          subtitle={`${t('dashboard.monthlyCost')}: ${formatCurrency(metrics.monthlyProjectedCost)}`}
          icon={<svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-accent"
          trend={{ value: 8.1, isPositive: false }}
        />
        <MetricCard
          title={t('dashboard.uptime')}
          value={formatPercentage(metrics.uptime, 2)}
          subtitle={`${metrics.alerts} ${t('dashboard.alerts').toLowerCase()}`}
          icon={<svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
          color="bg-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cost Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            {t('dashboard.costTrends')}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--theme-bg-popover)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
                name="Actual Cost"
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorProjected)"
                name="Projected"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Resource Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            {t('dashboard.resourceDistribution')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data?.resourceDistribution ?? []}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
                nameKey="provider"
              >
                {(data?.resourceDistribution ?? []).map((_: any, index: number) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--theme-bg-popover)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {(data?.resourceDistribution ?? []).map((item: any, i: number) => (
              <div key={item.provider} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-text-secondary">{item.provider}</span>
                </div>
                <span className="font-medium text-text-primary">
                  {item.count.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
