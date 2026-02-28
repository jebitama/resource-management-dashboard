/**
 * ==========================================================================
 * Application Shell
 * ==========================================================================
 * Root component that composes the layout: Sidebar + Header + Main Content.
 * Uses AnimatePresence for smooth transitions between dashboard views.
 * Manages the active view state at the top level.
 * ==========================================================================
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Sidebar } from '@/components/layout/Sidebar';
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
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto">
              {/* Suspense wrapper for lazy-loaded route views */}
              <Suspense fallback={<PageLoader message="Preparing your dashboard..." />}>
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<DashboardView />} />
                    <Route path="/resources" element={<ResourcesView />} />
                    <Route path="/live-feed" element={<LiveFeedView />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/queue-logs" element={<QueueLogs />} />
                    {/* Fallback to dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}

