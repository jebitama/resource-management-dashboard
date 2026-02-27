/**
 * ==========================================================================
 * Sidebar Navigation
 * ==========================================================================
 * Collapsible sidebar with icon + label navigation items.
 * Uses Framer Motion for smooth collapse/expand animation.
 * Active route is highlighted via current view state.
 * ==========================================================================
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { useRBAC } from '@/hooks/useRBAC';
import { RequestAccessModal } from '@/features/admin/components/RequestAccessModal';
import { cn } from '@/lib/utils';

// ---------- Types ----------

export type ViewId = 'dashboard' | 'resources' | 'live-feed' | 'admin';

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
}

interface NavItem {
  id: ViewId;
  labelKey: string;
  icon: React.ReactNode;
}

// ---------- Navigation Items ----------

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'resources',
    labelKey: 'nav.resources',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    id: 'live-feed',
    labelKey: 'nav.liveFeed', // We'll add this to translation or fallback
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'admin',
    labelKey: 'Admin Panel', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  }
];

// ---------- Component ----------

export const Sidebar = memo(function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const isCollapsed = useAppStore((s) => s.preferences.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const { hasElevatedAccess } = useRBAC();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'admin' && !hasElevatedAccess) return false;
    return true;
  });

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex flex-col border-r border-border bg-bg-sidebar',
        'h-screen sticky top-0 z-40'
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex h-16 items-center border-b border-border overflow-hidden",
        isCollapsed ? "justify-center" : "justify-between px-4"
      )}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">R</span>
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-text-primary">
                ResManager
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
            >
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2" role="navigation" aria-label="Main navigation">
        {visibleNavItems.map((item) => {
          const isActive = item.id === currentView;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex w-full items-center rounded-lg py-2.5 transition-all',
                isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3',
                'text-sm font-medium hover:bg-bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {item.labelKey.includes('.') ? t(item.labelKey) : item.labelKey}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Restricted User Actions */}
      {!hasElevatedAccess && (
        <div className={cn("border-t border-border", isCollapsed ? "p-2" : "p-4")}>
           <button
             onClick={() => setIsAccessModalOpen(true)}
             title={isCollapsed ? "Request Access" : undefined}
             className={cn(
               'flex w-full items-center justify-center rounded-lg py-2 text-xs font-semibold',
               'bg-bg-muted/50 text-text-primary hover:bg-bg-muted border border-border transition-all hover:border-primary/50',
               !isCollapsed && 'gap-2'
             )}
           >
             {!isCollapsed && <span>Request Access</span>}
             <svg className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
             </svg>
           </button>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t border-border p-2">
        <RequestAccessModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center justify-center rounded-lg p-2',
            'text-text-muted hover:text-text-primary hover:bg-bg-muted',
            'transition-colors focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <motion.svg
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </motion.svg>
        </button>
      </div>
    </motion.aside>
  );
});
