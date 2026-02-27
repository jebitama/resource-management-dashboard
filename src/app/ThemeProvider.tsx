/**
 * ==========================================================================
 * Theme Provider
 * ==========================================================================
 * Manages dark/light mode via React Context. Syncs with:
 * - Zustand store (state management)
 * - localStorage (persistence across sessions)
 * - HTML `class` attribute (Tailwind's dark mode strategy)
 *
 * Uses useEffect to apply the theme class to <html> on mount and on change,
 * ensuring SSR-compatibility and preventing FOUC (Flash of Unstyled Content).
 * ==========================================================================
 */

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useAppStore } from '@/store/appStore';
import type { ThemeMode } from '@/types';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppStore((s) => s.preferences.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setTheme = useAppStore((s) => s.setTheme);

  /**
   * Sync theme class to <html> element whenever the theme changes.
   * This enables Tailwind's `dark:` variant to work correctly.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context. Throws if used outside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
