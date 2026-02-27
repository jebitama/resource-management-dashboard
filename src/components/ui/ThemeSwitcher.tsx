/**
 * Theme Switcher Component
 * Animated dark/light mode toggle with Framer Motion.
 * Persists to localStorage via Zustand store.
 * Fully keyboard-accessible with aria-label.
 */

import { motion } from 'framer-motion';
import { useTheme } from '@/app/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={t('theme.toggle')}
      className={cn(
        'relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDark ? 'bg-primary/30' : 'bg-bg-muted'
      )}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full shadow-sm',
          isDark ? 'ml-7 bg-primary' : 'ml-1 bg-white'
        )}
      >
        {isDark ? (
          <motion.svg
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            className="h-3.5 w-3.5 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            className="h-3.5 w-3.5 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </motion.svg>
        )}
      </motion.div>
    </button>
  );
}
