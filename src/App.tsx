/**
 * ==========================================================================
 * Application Shell
 * ==========================================================================
 * Root component that composes the layout: Sidebar + Header + Main Content.
 * Uses AnimatePresence for smooth transitions between dashboard views.
 * Manages the active view state at the top level.
 * ==========================================================================
 */

import { useState, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Sidebar, type ViewId } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageLoader } from '@/components/ui/PageLoader';

// Lazy loaded views
const SignInPage = lazy(() => import('@/features/auth/SignInPage').then(module => ({ default: module.SignInPage })));
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const DashboardView = lazy(() => import('@/features/dashboard/DashboardView').then(module => ({ default: module.DashboardView })));
const ResourcesView = lazy(() => import('@/features/resources/ResourcesView').then(module => ({ default: module.ResourcesView })));
const LiveFeedView = lazy(() => import('@/features/live-feed/LiveFeedView').then(module => ({ default: module.LiveFeedView })));
const QueueLogs = lazy(() => import('@/features/queue/QueueLogs').then(module => ({ default: module.QueueLogs })));

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
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><PageLoader message="Loading authentication securely..." /></div>}>
          <SignInPage />
        </Suspense>
      </SignedOut>
      
      <SignedIn>
        <div className="flex h-screen overflow-hidden bg-bg-main">
          {/* Sidebar Navigation */}
          <Sidebar currentView={currentView} onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto">
              {/* Suspense wrapper for lazy-loaded route views */}
              <Suspense fallback={<PageLoader message="Preparing your dashboard..." />}>
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
              </Suspense>
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}

