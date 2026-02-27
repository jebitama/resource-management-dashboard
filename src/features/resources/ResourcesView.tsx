/**
 * ==========================================================================
 * Virtualized Data Table — High-Performance Resource List
 * ==========================================================================
 * Renders 10,000+ rows using react-window's FixedSizeList for virtualized
 * rendering. Only visible rows are mounted in the DOM, enabling smooth
 * scrolling even with massive datasets.
 *
 * Performance patterns used:
 * - React.memo on Row component to prevent unnecessary re-renders
 * - useMemo for filtered/sorted data to avoid recalculation
 * - useCallback for event handlers to maintain referential equality
 * ==========================================================================
 */

import { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useResources, useUpdateResourceStatus } from '@/features/resources/hooks/useResources';
import { useAppStore } from '@/store/appStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage, formatRelativeTime } from '@/lib/utils';
import type { Resource, ResourceStatusType, SortConfig } from '@/types';
import { ResourceStatus, Department } from '@/types';

// ---------- Constants ----------

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 48;

// ---------- Row Component ----------

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: Resource[];
    onStatusChange: (id: string, status: ResourceStatusType) => void;
  };
}

/**
 * React.memo: Each row is memoized to prevent re-rendering when sibling
 * rows update. With 10,000+ rows (even virtualized), preventing re-renders
 * of visible rows (~20-30 at a time) during parent state changes is critical.
 */
const TableRow = memo(function TableRow({ index, style, data }: RowProps) {
  const { items, onStatusChange } = data;
  const resource = items[index];

  if (!resource) return null;

  const cpuColor =
    resource.cpuUtilization > 80
      ? 'text-destructive'
      : resource.cpuUtilization > 60
        ? 'text-warning'
        : 'text-success';

  const memColor =
    resource.memoryUtilization > 80
      ? 'text-destructive'
      : resource.memoryUtilization > 60
        ? 'text-warning'
        : 'text-success';

  return (
    <div
      style={style}
      className={cn(
        'flex items-center border-b border-border/50 px-4 text-xs',
        'hover:bg-bg-muted/50 transition-colors',
        index % 2 === 0 ? 'bg-transparent' : 'bg-bg-muted/20'
      )}
      role="row"
      aria-rowindex={index + 2}
    >
      {/* Name */}
      <div className="w-[22%] min-w-[180px] truncate pr-2">
        <span className="font-medium text-text-primary">{resource.name}</span>
      </div>

      {/* Type */}
      <div className="w-[8%] min-w-[70px]">
        <span className="rounded bg-bg-muted px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
          {resource.type}
        </span>
      </div>

      {/* Status */}
      <div className="w-[10%] min-w-[90px]">
        <StatusBadge status={resource.status} />
      </div>

      {/* Region */}
      <div className="w-[10%] min-w-[90px] text-text-secondary">
        {resource.region}
      </div>

      {/* Provider */}
      <div className="w-[8%] min-w-[70px] font-medium text-text-secondary">
        {resource.provider}
      </div>

      {/* CPU */}
      <div className={cn('w-[7%] min-w-[55px] tabular-nums font-medium', cpuColor)}>
        {formatPercentage(resource.cpuUtilization)}
      </div>

      {/* Memory */}
      <div className={cn('w-[7%] min-w-[55px] tabular-nums font-medium', memColor)}>
        {formatPercentage(resource.memoryUtilization)}
      </div>

      {/* Cost */}
      <div className="w-[8%] min-w-[65px] tabular-nums text-text-secondary">
        {formatCurrency(resource.costPerHour)}
      </div>

      {/* Department */}
      <div className="w-[10%] min-w-[85px] text-text-secondary truncate">
        {resource.department}
      </div>

      {/* Last Health Check */}
      <div className="w-[10%] min-w-[80px] text-text-muted">
        {formatRelativeTime(resource.lastHealthCheck)}
      </div>

      {/* Actions */}
      <div className="flex-1 flex justify-end">
        {resource.status === 'ACTIVE' && (
          <button
            onClick={() => onStatusChange(resource.id, ResourceStatus.MAINTENANCE)}
            className="rounded px-2 py-1 text-[10px] font-medium text-warning hover:bg-warning/10 transition-colors"
            aria-label={`Set ${resource.name} to maintenance`}
          >
            Maintain
          </button>
        )}
      </div>
    </div>
  );
});

// ---------- Table Filters ----------

function TableFilters() {
  const { t } = useTranslation();
  const filters = useAppStore((s) => s.filters);
  const setSearchFilter = useAppStore((s) => s.setSearchFilter);
  const setStatusFilter = useAppStore((s) => s.setStatusFilter);
  const setDepartmentFilter = useAppStore((s) => s.setDepartmentFilter);
  const setProviderFilter = useAppStore((s) => s.setProviderFilter);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.department !== 'ALL' ||
    filters.provider !== 'ALL';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={t('resources.search')}
          value={filters.search}
          onChange={(e) => setSearchFilter(e.target.value)}
          className={cn(
            'h-8 rounded-lg border border-border bg-bg-input pl-8 pr-3 text-xs text-text-primary',
            'placeholder:text-text-muted focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring',
            'w-[200px] transition-colors'
          )}
          aria-label={t('resources.search')}
        />
      </div>

      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={(e) => setStatusFilter(e.target.value as typeof filters.status)}
        className={cn(
          'h-8 rounded-lg border border-border bg-bg-input px-2 text-xs text-text-primary',
          'focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring'
        )}
        aria-label={t('resources.status')}
      >
        <option value="ALL">{t('common.all')} {t('resources.status')}</option>
        {Object.values(ResourceStatus).map((s) => (
          <option key={s} value={s}>{t(`status.${s}`)}</option>
        ))}
      </select>

      {/* Department Filter */}
      <select
        value={filters.department}
        onChange={(e) => setDepartmentFilter(e.target.value as typeof filters.department)}
        className={cn(
          'h-8 rounded-lg border border-border bg-bg-input px-2 text-xs text-text-primary',
          'focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring'
        )}
        aria-label={t('resources.department')}
      >
        <option value="ALL">{t('common.all')} {t('resources.department')}</option>
        {Object.values(Department).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Provider Filter */}
      <select
        value={filters.provider}
        onChange={(e) => setProviderFilter(e.target.value as typeof filters.provider)}
        className={cn(
          'h-8 rounded-lg border border-border bg-bg-input px-2 text-xs text-text-primary',
          'focus:border-border-active focus:outline-none focus:ring-1 focus:ring-ring'
        )}
        aria-label={t('resources.provider')}
      >
        <option value="ALL">{t('common.all')} {t('resources.provider')}</option>
        {(['AWS', 'GCP', 'Azure', 'On-Premise'] as const).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Reset */}
      <AnimatePresence>
       {hasActiveFilters && (
         <motion.button
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.9 }}
           onClick={resetFilters}
           className="h-8 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary hover:bg-bg-muted transition-colors"
         >
           {t('resources.resetFilters')}
         </motion.button>
       )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Main Component ----------

export function ResourcesView() {
  const { t } = useTranslation();
  const filters = useAppStore((s) => s.filters);
  const sort = useAppStore((s) => s.sort);
  const setSort = useAppStore((s) => s.setSort);

  const { data: resources, isLoading, error, refetch } = useResources(filters);
  const { mutate: updateStatus } = useUpdateResourceStatus();

  // State for container dimensions
  const [containerHeight, setContainerHeight] = useState(600);

  /**
   * useCallback: Maintains referential equality for the status change handler.
   * Without this, a new function would be created every render, causing ALL
   * visible virtualized rows to re-render (they receive this via `data` prop).
   */
  const handleStatusChange = useCallback(
    (resourceId: string, status: ResourceStatusType) => {
      updateStatus({ resourceId, status });
    },
    [updateStatus]
  );

  /**
   * useMemo: Sorting 10,000 items is expensive. By memoizing the sorted
   * result, we only re-sort when the source data or sort config changes,
   * not on every render triggered by unrelated state updates (e.g., hover).
   */
  const sortedData = useMemo(() => {
    if (!resources) return [];

    return [...resources].sort((a, b) => {
      const key = sort.key as keyof Resource;
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [resources, sort]);

  const handleSort = useCallback(
    (key: string) => {
      setSort({
        key,
        direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc',
      });
    },
    [sort, setSort]
  );

  // Measure container ref callback
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContainerHeight(entry.contentRect.height - HEADER_HEIGHT);
        }
      });
      resizeObserver.observe(node);
    }
  }, []);

  /**
   * useMemo: Wrapping the itemData object to prevent creating a new object
   * reference every render. react-window uses this reference to determine
   * if rows need re-rendering.
   */
  const itemData = useMemo(
    () => ({
      items: sortedData,
      onStatusChange: handleStatusChange,
    }),
    [sortedData, handleStatusChange]
  );

  // Column headers config for sort UI
  const columns: { key: string; label: string; width: string; sortable: boolean }[] = [
    { key: 'name', label: t('resources.columns.name'), width: 'w-[22%] min-w-[180px]', sortable: true },
    { key: 'type', label: t('resources.columns.type'), width: 'w-[8%] min-w-[70px]', sortable: true },
    { key: 'status', label: t('resources.columns.status'), width: 'w-[10%] min-w-[90px]', sortable: true },
    { key: 'region', label: t('resources.columns.region'), width: 'w-[10%] min-w-[90px]', sortable: true },
    { key: 'provider', label: t('resources.columns.provider'), width: 'w-[8%] min-w-[70px]', sortable: true },
    { key: 'cpuUtilization', label: t('resources.columns.cpu'), width: 'w-[7%] min-w-[55px]', sortable: true },
    { key: 'memoryUtilization', label: t('resources.columns.memory'), width: 'w-[7%] min-w-[55px]', sortable: true },
    { key: 'costPerHour', label: t('resources.columns.cost'), width: 'w-[8%] min-w-[65px]', sortable: true },
    { key: 'department', label: t('resources.columns.department'), width: 'w-[10%] min-w-[85px]', sortable: true },
    { key: 'lastHealthCheck', label: t('resources.columns.lastCheck'), width: 'w-[10%] min-w-[80px]', sortable: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col p-6"
    >
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary">{t('resources.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('resources.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TableFilters />
      </div>

      {/* Row Count */}
      <div className="mb-2 text-xs text-text-muted">
        {t('resources.totalRows', { count: sortedData.length })}
      </div>

      {/* Table */}
      <div ref={containerRef} className="glass-card flex-1 overflow-hidden">
        {isLoading && !resources ? (
          <div className="flex h-64 items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <div className="space-y-3 text-center">
              <p className="text-sm text-destructive">{t('common.error')}</p>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-text-muted">{t('resources.noResults')}</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div
              className="flex items-center border-b border-border bg-bg-muted/50 px-4"
              style={{ height: HEADER_HEIGHT }}
              role="row"
              aria-rowindex={1}
            >
              {columns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    col.width,
                    'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider',
                    'text-text-muted hover:text-text-primary transition-colors',
                    col.sortable && 'cursor-pointer'
                  )}
                  aria-sort={
                    sort.key === col.key
                      ? sort.direction === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  {col.label}
                  {sort.key === col.key && (
                    <span className="text-primary">
                      {sort.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
              <div className="flex-1" />
            </div>

            {/* Virtualized Rows */}
            <List
              height={Math.max(containerHeight, 400)}
              width="100%"
              itemCount={sortedData.length}
              itemSize={ROW_HEIGHT}
              itemData={itemData}
              overscanCount={10}
            >
              {TableRow}
            </List>
          </>
        )}
      </div>
    </motion.div>
  );
}
