/**
 * ==========================================================================
 * Project & Team Domain Types
 * ==========================================================================
 */

import { DepartmentType } from './common';

export const ProjectPriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type ProjectPriorityType = (typeof ProjectPriority)[keyof typeof ProjectPriority];

export interface TeamMember {
  readonly id: string;
  name: string;
  email: string;
  role: string;
  department: DepartmentType;
  avatar: string;
  currentAllocation: number; // percentage 0-100
  skills: readonly string[];
  joinedAt: string;
  isActive: boolean;
}

export interface Project {
  readonly id: string;
  name: string;
  code: string;
  priority: ProjectPriorityType;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  department: DepartmentType;
  lead: TeamMember;
  startDate: string;
  endDate: string | null;
  budget: number;
  spent: number;
  progress: number; // percentage 0-100
  resourceCount: number;
  teamSize: number;
}

export interface Allocation {
  readonly id: string;
  resourceId: string;
  projectId: string;
  teamMemberId: string;
  percentage: number;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
}
