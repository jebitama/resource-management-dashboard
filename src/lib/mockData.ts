/**
 * ==========================================================================
 * Mock Data Generator
 * ==========================================================================
 * Generates realistic enterprise infrastructure data for development.
 * Produces deterministic-style data with realistic names, regions,
 * and metrics that simulate a production environment.
 * ==========================================================================
 */

import type {
  Resource,
  TeamMember,
  Project,
  DashboardMetrics,
  ResourceDistribution,
  CostTrend,
  DepartmentType,
  ResourceStatusType,
  ProjectPriorityType,
} from '@/types';
import { Department, ResourceStatus, ProjectPriority } from '@/types';

// ---------- Helpers ----------

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ---------- Resource Names ----------

const RESOURCE_PREFIXES = [
  'prod', 'staging', 'dev', 'edge', 'core', 'cache', 'proxy', 'worker',
  'analytics', 'ml', 'api', 'gateway', 'auth', 'media', 'search', 'queue',
];

const RESOURCE_SUFFIXES = [
  'primary', 'secondary', 'replica', 'hot-standby', 'blue', 'green',
  'canary', 'baseline', 'optimized', 'dedicated', 'shared', 'burst',
];

const REGIONS = [
  'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
  'ap-southeast-1', 'ap-northeast-1', 'sa-east-1', 'ca-central-1',
];

const RESOURCE_TYPES: Resource['type'][] = [
  'COMPUTE', 'STORAGE', 'NETWORK', 'DATABASE', 'CDN', 'CONTAINER',
];

const PROVIDERS: Resource['provider'][] = ['AWS', 'GCP', 'Azure', 'On-Premise'];

const STATUSES: ResourceStatusType[] = [
  ResourceStatus.ACTIVE, ResourceStatus.ACTIVE, ResourceStatus.ACTIVE, // weighted toward active
  ResourceStatus.IDLE, ResourceStatus.OVERLOADED, ResourceStatus.MAINTENANCE,
];

// ---------- Team Member Data ----------

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Drew', 'Quinn',
  'Reese', 'Avery', 'Harper', 'Emerson', 'Sage', 'Dakota', 'Remy', 'Blair',
  'Skyler', 'Ellis', 'Jamie', 'Rowan', 'Andi', 'Kai', 'Nico', 'Sasha',
];

const LAST_NAMES = [
  'Chen', 'Nakamura', 'Singh', 'Mueller', 'Santos', 'Kim', 'Okafor',
  'Petrov', 'Andersen', 'Tanaka', 'Ivanova', 'Costa', 'Park', 'Novak',
  'Yamamoto', 'Fernandez', 'Johansson', 'Liu', 'Patel', 'Bergström',
];

const ROLES = [
  'Senior Engineer', 'Staff Engineer', 'Principal Engineer',
  'Engineering Manager', 'DevOps Lead', 'Data Engineer',
  'Cloud Architect', 'SRE Lead', 'Security Engineer',
  'Platform Engineer', 'Product Manager', 'Tech Lead',
];

const SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust',
  'AWS', 'GCP', 'Kubernetes', 'Docker', 'Terraform', 'GraphQL',
  'PostgreSQL', 'Redis', 'Kafka', 'gRPC', 'CI/CD', 'Monitoring',
];

// ---------- Generators ----------

export function generateResource(index: number): Resource {
  const prefix = randomItem(RESOURCE_PREFIXES);
  const suffix = randomItem(RESOURCE_SUFFIXES);
  const type = randomItem(RESOURCE_TYPES);
  const status = randomItem(STATUSES);

  return {
    id: `res-${String(index).padStart(5, '0')}`,
    name: `${prefix}-${type.toLowerCase()}-${suffix}-${String(index).padStart(3, '0')}`,
    type,
    status,
    region: randomItem(REGIONS),
    provider: randomItem(PROVIDERS),
    cpuUtilization: status === ResourceStatus.OVERLOADED
      ? randomBetween(85, 99)
      : status === ResourceStatus.IDLE
        ? randomBetween(0, 15)
        : randomBetween(20, 80),
    memoryUtilization: status === ResourceStatus.OVERLOADED
      ? randomBetween(80, 98)
      : randomBetween(15, 75),
    costPerHour: randomBetween(0.02, 12.5),
    tags: [type.toLowerCase(), randomItem(REGIONS).split('-')[0]!, status.toLowerCase()],
    department: randomItem(Object.values(Department)) as DepartmentType,
    lastHealthCheck: new Date(
      Date.now() - Math.floor(Math.random() * 3600000)
    ).toISOString(),
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 90 * 24 * 3600000)
    ).toISOString(),
    updatedAt: new Date(
      Date.now() - Math.floor(Math.random() * 86400000)
    ).toISOString(),
  };
}

export function generateResources(count: number): Resource[] {
  return Array.from({ length: count }, (_, i) => generateResource(i));
}

export function generateTeamMember(index: number): TeamMember {
  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);
  const numSkills = Math.floor(Math.random() * 4) + 3;
  const memberSkills = Array.from({ length: numSkills }, () => randomItem(SKILLS));

  return {
    id: `tm-${String(index).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@enterprise.io`,
    role: randomItem(ROLES),
    department: randomItem(Object.values(Department)) as DepartmentType,
    avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${firstName}${lastName}`,
    currentAllocation: randomBetween(40, 100),
    skills: [...new Set(memberSkills)],
    joinedAt: new Date(
      Date.now() - Math.floor(Math.random() * 365 * 3 * 24 * 3600000)
    ).toISOString(),
    isActive: Math.random() > 0.1,
  };
}

export function generateTeamMembers(count: number): TeamMember[] {
  return Array.from({ length: count }, (_, i) => generateTeamMember(i));
}

const PROJECT_NAMES = [
  'Phoenix Migration', 'Atlas Platform', 'Nebula Analytics',
  'Horizon Gateway', 'Quantum Pipeline', 'Apex Integration',
  'Catalyst Engine', 'Summit Orchestration', 'Zenith Monitoring',
  'Nova Deployment', 'Prism Data Lake', 'Vertex ML Pipeline',
];

const PROJECT_STATUSES: Project['status'][] = [
  'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS',
  'PLANNING', 'ON_HOLD', 'COMPLETED',
];

export function generateProject(index: number, teamMembers: TeamMember[]): Project {
  const budget = randomBetween(50000, 2000000);
  const progress = Math.floor(Math.random() * 100);
  const priorities: ProjectPriorityType[] = [
    ProjectPriority.CRITICAL, ProjectPriority.HIGH,
    ProjectPriority.MEDIUM, ProjectPriority.LOW,
  ];

  return {
    id: `proj-${String(index).padStart(4, '0')}`,
    name: PROJECT_NAMES[index % PROJECT_NAMES.length]!,
    code: `PRJ-${String(index + 100).padStart(4, '0')}`,
    priority: randomItem(priorities),
    status: randomItem(PROJECT_STATUSES),
    department: randomItem(Object.values(Department)) as DepartmentType,
    lead: randomItem(teamMembers),
    startDate: new Date(
      Date.now() - Math.floor(Math.random() * 180 * 24 * 3600000)
    ).toISOString(),
    endDate: Math.random() > 0.3
      ? new Date(
          Date.now() + Math.floor(Math.random() * 180 * 24 * 3600000)
        ).toISOString()
      : null,
    budget,
    spent: budget * (progress / 100) * randomBetween(0.8, 1.2),
    progress,
    resourceCount: Math.floor(Math.random() * 30) + 5,
    teamSize: Math.floor(Math.random() * 15) + 3,
  };
}

// ---------- Dashboard Metrics ----------

export function generateDashboardMetrics(): DashboardMetrics {
  return {
    totalResources: 10247,
    activeResources: 8934,
    avgCpuUtilization: randomBetween(45, 72),
    avgMemoryUtilization: randomBetween(50, 78),
    totalCostPerHour: randomBetween(1250, 1800),
    monthlyProjectedCost: randomBetween(900000, 1300000),
    activeProjects: 47,
    teamCapacity: randomBetween(72, 88),
    alerts: Math.floor(Math.random() * 12) + 1,
    uptime: randomBetween(99.92, 99.99),
  };
}

export function generateResourceDistribution(): ResourceDistribution[] {
  return [
    { provider: 'AWS', count: 4521, percentage: 44.1 },
    { provider: 'GCP', count: 2890, percentage: 28.2 },
    { provider: 'Azure', count: 1982, percentage: 19.3 },
    { provider: 'On-Premise', count: 854, percentage: 8.4 },
  ];
}

export function generateCostTrends(): CostTrend[] {
  const trends: CostTrend[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const baseCost = 35000 + Math.sin(i / 5) * 5000;
    trends.push({
      date: date.toISOString().split('T')[0]!,
      cost: Math.round(baseCost + randomBetween(-2000, 2000)),
      projected: Math.round(baseCost * 1.05 + randomBetween(-1000, 1000)),
    });
  }

  return trends;
}
