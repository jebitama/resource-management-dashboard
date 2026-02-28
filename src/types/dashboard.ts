/**
 * ==========================================================================
 * Dashboard Domain Types
 * ==========================================================================
 */

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

export interface CostTrend {
  date: string;
  cost: number;
  projected: number;
}
