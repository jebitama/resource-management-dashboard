/**
 * ==========================================================================
 * useResources — TanStack Query Data Fetching Hook
 * ==========================================================================
 * Custom hook demonstrating production-grade data fetching patterns:
 *
 * - Loading, error, and success states
 * - Optimistic updates (mutate locally, rollback on error)
 * - Cache invalidation after mutations
 * - Stale-while-revalidate strategy
 * - Type-safe query keys for cache management
 *
 * The mock API simulates realistic latency and occasional errors
 * to demonstrate robust error handling patterns.
 * ==========================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Resource, ResourceStatusType, TableFilters } from '@/types';
import { generateResources } from '@/lib/mockData';

// ---------- Query Keys ----------

/**
 * Query key factory — centralizes key management for type-safety
 * and cache invalidation. Following the TanStack Query best practice
 * of hierarchical key factories.
 */
export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: TableFilters) => [...resourceKeys.lists(), filters] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...resourceKeys.details(), id] as const,
};

// ---------- Mock API Functions ----------

/**
 * Simulates fetching resources from a REST API.
 * In production, this would be a fetch/axios call to /api/resources.
 */
async function fetchResources(filters: TableFilters): Promise<Resource[]> {
  // Simulate network latency (200-600ms)
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 400 + 200));

  // Simulate occasional network errors (5% failure rate)
  if (Math.random() < 0.05) {
    throw new Error('Network error: Failed to fetch resources. Please try again.');
  }

  let resources = generateResources(10000);

  // Apply filters
  if (filters.search) {
    const search = filters.search.toLowerCase();
    resources = resources.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.region.toLowerCase().includes(search) ||
        r.department.toLowerCase().includes(search)
    );
  }

  if (filters.status !== 'ALL') {
    resources = resources.filter((r) => r.status === filters.status);
  }

  if (filters.department !== 'ALL') {
    resources = resources.filter((r) => r.department === filters.department);
  }

  if (filters.provider !== 'ALL') {
    resources = resources.filter((r) => r.provider === filters.provider);
  }

  return resources;
}

/**
 * Simulates updating a resource's status via PATCH /api/resources/:id
 */
async function updateResourceStatus(params: {
  resourceId: string;
  status: ResourceStatusType;
}): Promise<Resource> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Simulate the updated resource
  const resource = generateResources(1)[0]!;
  return {
    ...resource,
    id: params.resourceId,
    status: params.status,
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Hooks ----------

/**
 * Fetches the resource list with automatic caching and refetching.
 *
 * staleTime: Data is considered fresh for 30 seconds — within this
 * window, React Query serves cached data without refetching.
 *
 * refetchOnWindowFocus: Automatically revalidates when the user
 * switches back to the tab (important for dashboards).
 */
export function useResources(filters: TableFilters) {
  return useQuery({
    queryKey: resourceKeys.list(filters),
    queryFn: () => fetchResources(filters),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Mutation for updating resource status with optimistic updates.
 *
 * Optimistic Update Flow:
 * 1. onMutate: Immediately update the cache with the expected result
 * 2. On success: Cache is already correct — no additional work needed
 * 3. On error: Rollback to the previous cache state
 *
 * This gives users instant feedback while the server processes the request.
 */
export function useUpdateResourceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateResourceStatus,

    /**
     * Called before the mutation function. We optimistically update
     * the cache and save the previous state for potential rollback.
     */
    onMutate: async (variables) => {
      // Cancel any in-flight refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: resourceKeys.all });

      // Snapshot previous cache state for rollback
      const previousResources = queryClient.getQueriesData({
        queryKey: resourceKeys.lists(),
      });

      // Optimistically update all matching queries in the cache
      queryClient.setQueriesData(
        { queryKey: resourceKeys.lists() },
        (old: Resource[] | undefined) =>
          old?.map((resource) =>
            resource.id === variables.resourceId
              ? { ...resource, status: variables.status, updatedAt: new Date().toISOString() }
              : resource
          )
      );

      return { previousResources };
    },

    /**
     * If the mutation fails, roll back to the cached snapshot.
     */
    onError: (_err, _variables, context) => {
      if (context?.previousResources) {
        context.previousResources.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    /**
     * Always refetch after mutation to ensure server state is synced.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}
