/**
 * ==========================================================================
 * Web Vitals — Core Performance Monitoring
 * ==========================================================================
 * Measures and reports Core Web Vitals metrics for production monitoring.
 * These metrics directly impact Google's page ranking and user experience:
 *
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render speed
 * - TTFB (Time to First Byte): Server responsiveness
 *
 * In production, reports would be sent to your analytics service
 * (e.g., Google Analytics, Datadog, New Relic).
 * ==========================================================================
 */

interface WebVitalMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

type ReportHandler = (metric: WebVitalMetric) => void;

// ---------- Thresholds (Google's recommendations) ----------

const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

function getRating(
  name: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// ---------- PerformanceObserver-Based Metrics ----------

/**
 * Observe Largest Contentful Paint (LCP)
 * Measures when the largest content element becomes visible.
 */
export function observeLCP(onReport: ReportHandler): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry) return;

      const value = lastEntry.startTime;
      onReport({
        id: `lcp-${Date.now()}`,
        name: 'LCP',
        value,
        delta: value,
        rating: getRating('LCP', value),
        navigationType: getNavigationType(),
      });
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // PerformanceObserver not supported for this entry type
  }
}

/**
 * Observe First Contentful Paint (FCP)
 */
export function observeFCP(onReport: ReportHandler): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (!fcpEntry) return;

      const value = fcpEntry.startTime;
      onReport({
        id: `fcp-${Date.now()}`,
        name: 'FCP',
        value,
        delta: value,
        rating: getRating('FCP', value),
        navigationType: getNavigationType(),
      });
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch {
    // PerformanceObserver not supported
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
export function observeCLS(onReport: ReportHandler): void {
  if (typeof PerformanceObserver === 'undefined') return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count shifts without recent user input
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (layoutShift.hadRecentInput) continue;

        const firstEntry = sessionEntries[0];
        if (
          sessionEntries.length > 0 &&
          firstEntry &&
          entry.startTime - firstEntry.startTime < 5000 &&
          entry.startTime - sessionEntries[sessionEntries.length - 1]!.startTime < 1000
        ) {
          sessionValue += layoutShift.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = layoutShift.value;
          sessionEntries = [entry];
        }

        if (sessionValue > clsValue) {
          clsValue = sessionValue;

          onReport({
            id: `cls-${Date.now()}`,
            name: 'CLS',
            value: clsValue,
            delta: clsValue,
            rating: getRating('CLS', clsValue),
            navigationType: getNavigationType(),
          });
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // PerformanceObserver not supported
  }
}

/**
 * Observe Interaction to Next Paint (INP) — replacement for FID
 */
export function observeINP(onReport: ReportHandler): void {
  if (typeof PerformanceObserver === 'undefined') return;

  let maxDuration = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > maxDuration) {
          maxDuration = entry.duration;

          onReport({
            id: `inp-${Date.now()}`,
            name: 'INP',
            value: maxDuration,
            delta: maxDuration,
            rating: getRating('INP', maxDuration),
            navigationType: getNavigationType(),
          });
        }
      }
    });

    observer.observe({ type: 'event', buffered: true });
  } catch {
    // PerformanceObserver not supported
  }
}

/**
 * Observe Time to First Byte (TTFB)
 */
export function observeTTFB(onReport: ReportHandler): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navEntry = entries[0] as PerformanceNavigationTiming | undefined;
      if (!navEntry) return;

      const value = navEntry.responseStart - navEntry.requestStart;
      onReport({
        id: `ttfb-${Date.now()}`,
        name: 'TTFB',
        value,
        delta: value,
        rating: getRating('TTFB', value),
        navigationType: getNavigationType(),
      });
    });

    observer.observe({ type: 'navigation', buffered: true });
  } catch {
    // PerformanceObserver not supported
  }
}

// ---------- Aggregate Reporter ----------

/**
 * Initialize all Web Vitals observers.
 * Call this in your app's entry point (main.tsx).
 *
 * Usage:
 *   import { reportWebVitals } from '@/lib/webVitals';
 *   reportWebVitals(console.log); // Dev
 *   reportWebVitals(sendToAnalytics); // Production
 */
export function reportWebVitals(onReport: ReportHandler): void {
  observeLCP(onReport);
  observeFCP(onReport);
  observeCLS(onReport);
  observeINP(onReport);
  observeTTFB(onReport);
}

/**
 * Console reporter with color-coded output.
 * Useful for development and debugging.
 */
export function logWebVitals(): void {
  reportWebVitals((metric) => {
    const colors = {
      good: 'color: #10b981',
      'needs-improvement': 'color: #f59e0b',
      poor: 'color: #ef4444',
    };

    console.log(
      `%c[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      colors[metric.rating]
    );
  });
}

// ---------- Helpers ----------

function getNavigationType(): string {
  if (typeof performance === 'undefined') return 'unknown';
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type ?? 'navigate';
}
