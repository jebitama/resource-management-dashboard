/**
 * ==========================================================================
 * Common Shared Types
 * ==========================================================================
 */

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

// Reference needed for circular or cross-module types
import { ResourceStatusType } from './resources';
import { Resource } from './resources';

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

export type ThemeMode = 'light' | 'dark';
export type LocaleCode = 'en' | 'id';

export interface UserPreferences {
  theme: ThemeMode;
  locale: LocaleCode;
  sidebarCollapsed: boolean;
  compactMode: boolean;
}

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
