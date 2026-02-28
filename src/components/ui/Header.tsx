/**
 * Header Component
 * Top bar with system health ticker, theme/language switchers, and user info.
 * Uses backdrop-filter for glassmorphism effect.
 */

import { UserButton, useUser } from '@clerk/clerk-react';
import { SystemHealthTicker } from '@/components/ui/SystemHealthTicker';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRBAC } from '@/hooks/useRBAC';
import { cn } from '@/lib/utils';

export function Header() {
  const { user } = useUser();
  const { role } = useRBAC();
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border px-6',
        'bg-bg-header backdrop-blur-md'
      )}
    >
      {/* Left: Logo & System Health Ticker */}
      <div className="flex flex-1 items-center gap-4 overflow-hidden">
        <img 
          src="/favicon.png" 
          alt="Dashboard Logo" 
          className="h-8 w-8 object-contain"
        />
        <div className="flex-1 overflow-hidden">
          <SystemHealthTicker />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="h-5 w-px bg-border" />
        <ThemeSwitcher />
        <div className="h-5 w-px bg-border" />

        {/* User Role Badge & Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold text-text-primary capitalize">{user?.firstName || 'User'}</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5 ${role === 'SUPERADMIN' ? 'bg-destructive/20 text-destructive' : role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-bg-muted text-text-muted'}`}>
              {role}
            </span>
          </div>
          <UserButton 
            appearance={{
              elements: { userButtonAvatarBox: 'h-8 w-8' }
            }}
          />
        </div>
      </div>
    </header>
  );
}
