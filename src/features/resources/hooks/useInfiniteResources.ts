/**
 * ==========================================================================
 * useInfiniteResources — Infinite Scroll with TanStack Query
 * ==========================================================================
 * Demonstrates useInfiniteQuery for cursor-based pagination with
 * automatic "load more" triggered by IntersectionObserver.
 *
 * Key patterns:
 * - Cursor-based pagination (getNextPageParam)
 * - Flattened page data via useMemo
 * - IntersectionObserver ref for auto-loading
 * - Type-safe page params
 * ==========================================================================
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import type { Resource } from '@/types';

import { useRBAC } from '@/hooks/useRBAC';

// ---------- Types ----------

interface ResourcePage {
  data: Resource[];
  nextCursor: string | null;
  totalCount: number;
  hasMore: boolean;
}

interface UseInfiniteResourcesOptions {
  pageSize?: number;
  enabled?: boolean;
}

const PAGE_SIZE_DEFAULT = 50;

/**
 * Calls the backend paginated endpoint
 */
async function fetchResourcePage(params: {
  cursor: string | null;
  pageSize: number;
  token: string | null;
}): Promise<ResourcePage> {
  const { cursor, pageSize, token } = params;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams({
    limit: pageSize.toString(),
  });

  if (cursor) {
    queryParams.append('cursor', cursor);
  }

  const res = await fetch(`/api/resources/list?${queryParams.toString()}`, { headers });
  
  if (!res.ok) {
    throw new Error('Failed to fetch resources');
  }

  return res.json();
}

// ---------- Hook ----------

export function useInfiniteResources(options: UseInfiniteResourcesOptions = {}) {
  const { pageSize = PAGE_SIZE_DEFAULT, enabled = true } = options;
  const { getToken } = useRBAC();

  const query = useInfiniteQuery({
    queryKey: ['resources', 'infinite', pageSize],
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      return fetchResourcePage({ cursor: pageParam, pageSize, token });
    },

    /**
     * initialPageParam: Starting cursor value (null = first page).
     * Required by TanStack Query v5 for type safety.
     */
    initialPageParam: null as string | null,

    /**
     * getNextPageParam: Extracts the cursor for the next page from
     * the last fetched page. Returning undefined signals no more pages.
     */
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    enabled,
    staleTime: 60 * 1000, // Data fresh for 60s (longer for infinite lists)
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10min
  });

  /**
   * useMemo: Flatten all pages into a single array.
   * Without memoization, this would create a new array reference on every
   * render, causing downstream components to re-render unnecessarily.
   */
  const allResources = useMemo(
    () => {
      const flatData = query.data?.pages.flatMap((page) => page.data) ?? [];
      console.log('useInfiniteResources -> flatData:', flatData.length, 'pages:', query.data?.pages.length);
      return flatData;
    },
    [query.data?.pages]
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return {
    ...query,
    resources: allResources,
    totalCount,
  };
}

// ---------- Infinite Scroll Observer Hook ----------

/**
 * useInfiniteScrollTrigger
 *
 * Returns a ref callback to attach to a "sentinel" element at the bottom
 * of the list. When the sentinel enters the viewport, it automatically
 * calls `fetchNextPage()` to load more items.
 *
 * Uses IntersectionObserver for performance (no scroll event listeners).
 */
export function useInfiniteScrollTrigger(params: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = params;
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * useCallback: The ref callback must be stable to avoid creating
   * and destroying the IntersectionObserver on every render.
   */
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        {
          // Trigger 200px before the sentinel is visible
          rootMargin: '200px',
          threshold: 0,
        }
      );

      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return sentinelRef;
}
