/**
 * Header Component
 * Top bar with system health ticker, theme/language switchers, and user info.
 * Uses backdrop-filter for glassmorphism effect.
 */

import { SystemHealthTicker } from '@/components/ui/SystemHealthTicker';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border px-6',
        'bg-bg-header backdrop-blur-md'
      )}
    >
      {/* Left: System Health Ticker */}
      <div className="flex-1 overflow-hidden">
        <SystemHealthTicker />
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="h-5 w-px bg-border" />
        <ThemeSwitcher />
        <div className="h-5 w-px bg-border" />

        {/* User Avatar */}
        <button
          aria-label="User menu"
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-1.5',
            'hover:bg-bg-muted transition-colors',
            'focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            AD
          </div>
          <span className="hidden text-sm font-medium text-text-primary md:inline">
            Admin
          </span>
        </button>
      </div>
    </header>
  );
}
