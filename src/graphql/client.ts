/**
 * ==========================================================================
 * GraphQL Client Configuration
 * ==========================================================================
 * Apollo Client with InMemoryCache configured with type policies for
 * normalized caching. Uses a SchemaLink with mock resolvers to simulate
 * a production GraphQL API without requiring a running backend.
 *
 * Type policies define how entities are identified and merged in the cache,
 * enabling optimistic updates and cache invalidation patterns.
 * ==========================================================================
 */

import { ApolloClient, InMemoryCache, ApolloLink, Observable } from '@apollo/client';
import type { Operation, FetchResult } from '@apollo/client';
import {
  generateDashboardMetrics,
  generateResourceDistribution,
  generateCostTrends,
  generateResources,
  generateTeamMembers,
  generateProject,
} from '@/lib/mockData';

// ---------- Cache Configuration ----------

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        resources: {
          /**
           * Merge function for paginated resource queries.
           * Appends new results to existing cached data when using
           * cursor-based pagination (fetchMore pattern).
           */
          keyArgs: ['filters'],
          merge(existing, incoming) {
            if (!existing) return incoming;
            return {
              ...incoming,
              nodes: [...(existing.nodes || []), ...incoming.nodes],
            };
          },
        },
      },
    },
    Resource: {
      keyFields: ['id'],
    },
    TeamMember: {
      keyFields: ['id'],
    },
    Project: {
      keyFields: ['id'],
    },
  },
});

// ---------- Mock Link ----------

/**
 * Custom Apollo Link that intercepts all operations and returns
 * mock data based on the operation name. Simulates network latency
 * with a configurable delay.
 */
const mockLink = new ApolloLink((operation: Operation) => {
  return new Observable<FetchResult>((observer) => {
    const delay = Math.random() * 300 + 200; // 200-500ms simulated latency

    const timeout = setTimeout(() => {
      const data = resolveOperation(operation);
      observer.next({ data });
      observer.complete();
    }, delay);

    // Cleanup on unsubscribe (prevents memory leaks)
    return () => clearTimeout(timeout);
  });
});

// ---------- Mock Resolver ----------

function resolveOperation(operation: Operation): Record<string, unknown> {
  const teamMembers = generateTeamMembers(24);

  switch (operation.operationName) {
    case 'GetDashboardMetrics':
      return {
        dashboardMetrics: generateDashboardMetrics(),
        resourceDistribution: generateResourceDistribution(),
        costTrends: generateCostTrends(),
      };

    case 'GetResources': {
      const resources = generateResources(100);
      return {
        resources: {
          __typename: 'ResourceConnection',
          nodes: resources,
          totalCount: 10247,
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: true,
            endCursor: 'cursor-100',
          },
        },
      };
    }

    case 'GetTeamOverview':
      return {
        teamMembers,
        departmentSummary: [
          { __typename: 'DepartmentSummary', department: 'Engineering', memberCount: 8, avgAllocation: 85.3 },
          { __typename: 'DepartmentSummary', department: 'DevOps', memberCount: 5, avgAllocation: 92.1 },
          { __typename: 'DepartmentSummary', department: 'Data Science', memberCount: 4, avgAllocation: 78.5 },
          { __typename: 'DepartmentSummary', department: 'Design', memberCount: 3, avgAllocation: 71.2 },
          { __typename: 'DepartmentSummary', department: 'Product', memberCount: 2, avgAllocation: 65.8 },
          { __typename: 'DepartmentSummary', department: 'Security', memberCount: 2, avgAllocation: 88.4 },
        ],
      };

    case 'GetProjects':
      return {
        projects: {
          __typename: 'ProjectConnection',
          nodes: Array.from({ length: 12 }, (_, i) =>
            generateProject(i, teamMembers)
          ),
          totalCount: 47,
        },
      };

    default:
      console.warn(`[GraphQL Mock] Unhandled operation: ${operation.operationName}`);
      return {};
  }
}

// ---------- Client Instance ----------

export const apolloClient = new ApolloClient({
  link: mockLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});
