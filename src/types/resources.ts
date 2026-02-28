/**
 * ==========================================================================
 * Resource Domain Types
 * ==========================================================================
 */

import { DepartmentType } from './common';

export const ResourceStatus = {
  ACTIVE: 'ACTIVE',
  IDLE: 'IDLE',
  OVERLOADED: 'OVERLOADED',
  MAINTENANCE: 'MAINTENANCE',
  DECOMMISSIONED: 'DECOMMISSIONED',
} as const;

export type ResourceStatusType = (typeof ResourceStatus)[keyof typeof ResourceStatus];

export interface Resource {
  readonly id: string;
  name: string;
  type: 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'DATABASE' | 'CDN' | 'CONTAINER';
  status: ResourceStatusType;
  region: string;
  provider: 'AWS' | 'GCP' | 'Azure' | 'On-Premise';
  cpuUtilization: number;
  memoryUtilization: number;
  costPerHour: number;
  tags: readonly string[];
  department: DepartmentType;
  lastHealthCheck: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceDistribution {
  provider: Resource['provider'];
  count: number;
  percentage: number;
}
