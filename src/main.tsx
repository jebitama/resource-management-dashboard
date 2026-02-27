/**
 * Application Entry Point
 * Sets up all providers: React Query, Apollo, Theme, i18n.
 * Provider order matters — Theme must wrap content but be inside stores.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client/react';
import { ClerkProvider } from '@clerk/clerk-react';
import { apolloClient } from '@/graphql/client';
import { ThemeProvider } from '@/app/ThemeProvider';
import App from '@/App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZHVtbXktdG9rZW4uY2xlcmsuYWNjb3VudHMuZGV2JA';

// Import i18n config (side-effect: initializes i18next)
import '@/i18n';

// Import global styles
import '@/index.css';

/**
 * QueryClient configured with production-ready defaults:
 * - 30s stale time to reduce unnecessary refetches
 * - 1 retry for transient network failures
 * - refetchOnWindowFocus for dashboard freshness
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>
);

// ---------- Performance Monitoring ----------
// Reports Core Web Vitals (LCP, FCP, CLS, INP, TTFB)
// In production, replace console.log with your analytics endpoint
import { logWebVitals } from '@/lib/webVitals';
logWebVitals();
