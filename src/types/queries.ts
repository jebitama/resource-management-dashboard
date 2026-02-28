/**
 * ==========================================================================
 * GraphQL Query & Response Types
 * ==========================================================================
 */

import { Resource } from './resources';
import { DashboardMetrics, CostTrend } from './dashboard';
import { ResourceDistribution } from './resources';
import { TeamMember, Project } from './projects';
import { DepartmentType } from './common';

export interface GetDashboardMetricsQuery {
  dashboardMetrics: DashboardMetrics;
  resourceDistribution: ResourceDistribution[];
  costTrends: CostTrend[];
}

export interface GetResourcesQuery {
  resources: {
    nodes: Resource[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

export interface GetTeamOverviewQuery {
  teamMembers: TeamMember[];
  departmentSummary: {
    department: DepartmentType;
    memberCount: number;
    avgAllocation: number;
  }[];
}

export interface GetProjectsQuery {
  projects: {
    nodes: Project[];
    totalCount: number;
  };
}
