/**
 * ==========================================================================
 * Application Store (Zustand + Immer)
 * ==========================================================================
 * Centralized state management using Zustand with Immer middleware for
 * immutable state updates. Organized into logical slices:
 *
 * - preferences: Theme, locale, sidebar, compact mode (persisted)
 * - filters: Table filtering state for resource views
 * - tableConfig: Sort and pagination configuration
 *
 * Immer allows writing "mutative" code that produces immutable updates,
 * resulting in cleaner reducers without spread operator nesting.
 * ==========================================================================
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ThemeMode,
  LocaleCode,
  TableFilters,
  SortConfig,
  UserPreferences,
} from '@/types';

// ---------- Store State Interface ----------

interface AppState {
  // User Preferences (persisted to localStorage)
  preferences: UserPreferences;

  // Table Filters
  filters: TableFilters;

  // Table Sort & Pagination
  sort: SortConfig;
  pagination: {
    page: number;
    pageSize: number;
  };

  // Actions — Preferences
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLocale: (locale: LocaleCode) => void;
  toggleSidebar: () => void;
  toggleCompactMode: () => void;

  // Actions — Filters
  setSearchFilter: (search: string) => void;
  setStatusFilter: (status: TableFilters['status']) => void;
  setDepartmentFilter: (department: TableFilters['department']) => void;
  setProviderFilter: (provider: TableFilters['provider']) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  resetFilters: () => void;

  // Actions — Table Config
  setSort: (sort: SortConfig) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

// ---------- Default Values ----------

const defaultFilters: TableFilters = {
  search: '',
  status: 'ALL',
  department: 'ALL',
  provider: 'ALL',
  dateRange: { from: null, to: null },
};

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  locale: 'en',
  sidebarCollapsed: false,
  compactMode: false,
};

// ---------- Store Definition ----------

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      preferences: defaultPreferences,
      filters: defaultFilters,
      sort: { key: 'name', direction: 'asc' },
      pagination: { page: 1, pageSize: 50 },

      // -- Preferences Actions --
      setTheme: (theme) =>
        set((state) => {
          state.preferences.theme = theme;
        }),

      toggleTheme: () =>
        set((state) => {
          state.preferences.theme =
            state.preferences.theme === 'dark' ? 'light' : 'dark';
        }),

      setLocale: (locale) =>
        set((state) => {
          state.preferences.locale = locale;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.preferences.sidebarCollapsed = !state.preferences.sidebarCollapsed;
        }),

      toggleCompactMode: () =>
        set((state) => {
          state.preferences.compactMode = !state.preferences.compactMode;
        }),

      // -- Filter Actions --
      setSearchFilter: (search) =>
        set((state) => {
          state.filters.search = search;
          state.pagination.page = 1; // Reset pagination on filter change
        }),

      setStatusFilter: (status) =>
        set((state) => {
          state.filters.status = status;
          state.pagination.page = 1;
        }),

      setDepartmentFilter: (department) =>
        set((state) => {
          state.filters.department = department;
          state.pagination.page = 1;
        }),

      setProviderFilter: (provider) =>
        set((state) => {
          state.filters.provider = provider;
          state.pagination.page = 1;
        }),

      setDateRange: (from, to) =>
        set((state) => {
          state.filters.dateRange = { from, to };
          state.pagination.page = 1;
        }),

      resetFilters: () =>
        set((state) => {
          state.filters = defaultFilters;
          state.pagination.page = 1;
        }),

      // -- Table Config Actions --
      setSort: (sort) =>
        set((state) => {
          state.sort = sort;
        }),

      setPage: (page) =>
        set((state) => {
          state.pagination.page = page;
        }),

      setPageSize: (pageSize) =>
        set((state) => {
          state.pagination.pageSize = pageSize;
          state.pagination.page = 1; // Reset to page 1 when changing page size
        }),
    })),
    {
      name: 'rmd-preferences',
      storage: createJSONStorage(() => localStorage),
      /**
       * Only persist user preferences (theme, locale, sidebar, compact mode).
       * Transient state like filters & pagination should not survive page reloads.
       */
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);
