/**
 * ==========================================================================
 * Core TypeScript Interfaces & Discriminated Unions
 * ==========================================================================
 * Strictly typed domain models for the Resource Management Dashboard.
 * Uses discriminated unions for WebSocket messages to enable exhaustive
 * pattern matching. No `any` types — all shapes are explicitly defined.
 * ==========================================================================
 */

// ---------- Enums & Constants ----------

export const ResourceStatus = {
  ACTIVE: 'ACTIVE',
  IDLE: 'IDLE',
  OVERLOADED: 'OVERLOADED',
  MAINTENANCE: 'MAINTENANCE',
  DECOMMISSIONED: 'DECOMMISSIONED',
} as const;

export type ResourceStatusType = (typeof ResourceStatus)[keyof typeof ResourceStatus];

export const ProjectPriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type ProjectPriorityType = (typeof ProjectPriority)[keyof typeof ProjectPriority];

export const Department = {
  ENGINEERING: 'Engineering',
  DESIGN: 'Design',
  PRODUCT: 'Product',
  DATA_SCIENCE: 'Data Science',
  DEVOPS: 'DevOps',
  QA: 'QA',
  SECURITY: 'Security',
  MANAGEMENT: 'Management',
} as const;

export type DepartmentType = (typeof Department)[keyof typeof Department];

// ---------- Domain Entities ----------

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

// ---------- Dashboard Metrics ----------

export interface DashboardMetrics {
  totalResources: number;
  activeResources: number;
  avgCpuUtilization: number;
  avgMemoryUtilization: number;
  totalCostPerHour: number;
  monthlyProjectedCost: number;
  activeProjects: number;
  teamCapacity: number;
  alerts: number;
  uptime: number;
}

export interface ResourceDistribution {
  provider: Resource['provider'];
  count: number;
  percentage: number;
}

export interface CostTrend {
  date: string;
  cost: number;
  projected: number;
}

// ---------- WebSocket Messages (Discriminated Union) ----------

export interface SystemHealthMessage {
  readonly type: 'SYSTEM_HEALTH';
  payload: {
    cpuAvg: number;
    memoryAvg: number;
    networkIn: number;
    networkOut: number;
    activeConnections: number;
    errorRate: number;
    timestamp: string;
  };
}

export interface MarketTickerMessage {
  readonly type: 'MARKET_TICKER';
  payload: {
    resourceId: string;
    metric: 'cpu' | 'memory' | 'network' | 'cost';
    value: number;
    previousValue: number;
    change: number;
    timestamp: string;
  };
}

export interface AlertMessage {
  readonly type: 'ALERT';
  payload: {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    resourceId: string | null;
    acknowledged: boolean;
    timestamp: string;
  };
}

export interface ResourceUpdateMessage {
  readonly type: 'RESOURCE_UPDATE';
  payload: {
    resourceId: string;
    field: keyof Resource;
    oldValue: string | number;
    newValue: string | number;
    timestamp: string;
  };
}

/**
 * Discriminated union for all WebSocket message types.
 * Enables exhaustive switch/case matching with TypeScript's
 * control flow analysis — each branch narrows the payload type.
 */
export type SocketMessage =
  | SystemHealthMessage
  | MarketTickerMessage
  | AlertMessage
  | ResourceUpdateMessage;

// ---------- Table Configuration ----------

export interface TableColumn<T> {
  id: string;
  header: string;
  accessorKey: keyof T;
  cell?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
}

export interface TableFilters {
  search: string;
  status: ResourceStatusType | 'ALL';
  department: DepartmentType | 'ALL';
  provider: Resource['provider'] | 'ALL';
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// ---------- Theme & Locale ----------

export type ThemeMode = 'light' | 'dark';
export type LocaleCode = 'en' | 'id';

export interface UserPreferences {
  theme: ThemeMode;
  locale: LocaleCode;
  sidebarCollapsed: boolean;
  compactMode: boolean;
}

// ---------- API Response Wrappers ----------

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// ---------- GraphQL Query Types ----------

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
