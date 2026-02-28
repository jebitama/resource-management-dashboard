/**
 * ==========================================================================
 * Application Shell
 * ==========================================================================
 * Root component that composes the layout: Sidebar + Header + Main Content.
 * Uses AnimatePresence for smooth transitions between dashboard views.
 * Manages the active view state at the top level.
 * ==========================================================================
 */

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Sidebar, type ViewId } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { SignInPage } from '@/features/auth/SignInPage';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { ResourcesView } from '@/features/resources/ResourcesView';
import { LiveFeedView } from '@/features/live-feed/LiveFeedView';
import { QueueLogs } from '@/features/queue/QueueLogs';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');

  /**
   * useCallback: Prevents creating a new navigate function on every render,
   * which would cause the memoized Sidebar to re-render unnecessarily.
   */
  const handleNavigate = useCallback((view: ViewId) => {
    setCurrentView(view);
  }, []);

  return (
    <>
      <SignedOut>
        <SignInPage />
      </SignedOut>
      
      <SignedIn>
        <div className="flex h-screen overflow-hidden bg-bg-main">
          {/* Sidebar Navigation */}
          <Sidebar currentView={currentView} onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentView === 'dashboard' && (
                  <DashboardView key="dashboard" />
                )}
                {currentView === 'resources' && (
                  <ResourcesView key="resources" />
                )}
                {currentView === 'live-feed' && (
                  <LiveFeedView key="live-feed" />
                )}
                {currentView === 'admin' && (
                  <AdminDashboard key="admin" />
                )}
                {currentView === 'queue-logs' && (
                  <QueueLogs key="queue-logs" />
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
