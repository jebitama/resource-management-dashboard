/**
 * ==========================================================================
 * GraphQL Queries — Typed Operations
 * ==========================================================================
 * All GraphQL queries used by the dashboard, with full TypeScript typing.
 * Uses gql tagged template literals for syntax highlighting and tooling.
 *
 * Query structure follows Relay-style pagination for scalable list queries
 * and flat field selection for dashboard aggregate queries.
 * ==========================================================================
 */

import { gql } from '@apollo/client';

// ---------- Dashboard ----------

export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics {
    dashboardMetrics {
      totalResources
      activeResources
      avgCpuUtilization
      avgMemoryUtilization
      totalCostPerHour
      monthlyProjectedCost
      activeProjects
      teamCapacity
      alerts
      uptime
    }
    resourceDistribution {
      provider
      count
      percentage
    }
    costTrends {
      date
      cost
      projected
    }
  }
`;

// ---------- Resources ----------

export const GET_RESOURCES = gql`
  query GetResources($first: Int, $after: String, $filters: ResourceFilterInput) {
    resources(first: $first, after: $after, filters: $filters) {
      nodes {
        id
        name
        type
        status
        region
        provider
        cpuUtilization
        memoryUtilization
        costPerHour
        tags
        department
        lastHealthCheck
        createdAt
        updatedAt
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ---------- Team ----------

export const GET_TEAM_OVERVIEW = gql`
  query GetTeamOverview {
    teamMembers {
      id
      name
      email
      role
      department
      avatar
      currentAllocation
      skills
      joinedAt
      isActive
    }
    departmentSummary {
      department
      memberCount
      avgAllocation
    }
  }
`;

// ---------- Projects ----------

export const GET_PROJECTS = gql`
  query GetProjects($first: Int, $status: ProjectStatus) {
    projects(first: $first, status: $status) {
      nodes {
        id
        name
        code
        priority
        status
        department
        lead {
          id
          name
          avatar
        }
        startDate
        endDate
        budget
        spent
        progress
        resourceCount
        teamSize
      }
      totalCount
    }
  }
`;

// ---------- Mutations ----------

export const UPDATE_RESOURCE_STATUS = gql`
  mutation UpdateResourceStatus($id: ID!, $status: ResourceStatus!) {
    updateResourceStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;
