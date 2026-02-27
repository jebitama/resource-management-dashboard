/**
 * ==========================================================================
 * Unit Tests — Core Utilities & Business Logic
 * ==========================================================================
 * Demonstrates a TDD-oriented testing approach with Vitest.
 * Tests cover:
 * - cn() utility (class merging and conflict resolution)
 * - Data formatters (currency, percentage, compact numbers)
 * - Filter logic and edge cases
 * - Debounce utility
 * ==========================================================================
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatRelativeTime,
  clamp,
  stringToColor,
  debounce,
} from '@/lib/utils';

// ---------- cn() — Class Name Utility ----------

describe('cn (class name utility)', () => {
  it('should merge simple class strings', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle conditional classes with falsy values', () => {
    const isActive = false;
    const result = cn('base', isActive && 'active', 'always');
    expect(result).toBe('base always');
  });

  it('should resolve Tailwind conflicts (last wins)', () => {
    // tailwind-merge should resolve p-4 vs p-2 to p-2 (last wins)
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('should resolve complex Tailwind conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle array inputs', () => {
    const result = cn(['flex', 'items-center'], 'gap-2');
    expect(result).toBe('flex items-center gap-2');
  });

  it('should handle object inputs (clsx-style)', () => {
    const result = cn({ 'bg-primary': true, 'text-white': true, 'opacity-50': false });
    expect(result).toBe('bg-primary text-white');
  });

  it('should handle empty and undefined inputs gracefully', () => {
    const result = cn('', undefined, null, 'valid');
    expect(result).toBe('valid');
  });
});

// ---------- formatCurrency ----------

describe('formatCurrency', () => {
  it('should format positive numbers as USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should format large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000');
  });

  it('should handle small decimals', () => {
    const result = formatCurrency(0.05);
    expect(result).toBe('$0.05');
  });
});

// ---------- formatPercentage ----------

describe('formatPercentage', () => {
  it('should format with default 1 decimal place', () => {
    expect(formatPercentage(75.456)).toBe('75.5%');
  });

  it('should format with custom decimal places', () => {
    expect(formatPercentage(99.9876, 2)).toBe('99.99%');
  });

  it('should handle zero', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('should handle 100%', () => {
    expect(formatPercentage(100)).toBe('100.0%');
  });
});

// ---------- formatCompactNumber ----------

describe('formatCompactNumber', () => {
  it('should format thousands with K suffix', () => {
    const result = formatCompactNumber(1500);
    expect(result).toBe('1.5K');
  });

  it('should format millions with M suffix', () => {
    const result = formatCompactNumber(2500000);
    expect(result).toBe('2.5M');
  });

  it('should format small numbers without suffix', () => {
    const result = formatCompactNumber(42);
    expect(result).toBe('42');
  });
});

// ---------- formatRelativeTime ----------

describe('formatRelativeTime', () => {
  it('should return "just now" for very recent dates', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('should format minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('should format hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should format days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});

// ---------- clamp ----------

describe('clamp', () => {
  it('should clamp value below min to min', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('should clamp value above max to max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('should return value when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('should handle equal min and max', () => {
    expect(clamp(50, 42, 42)).toBe(42);
  });
});

// ---------- stringToColor ----------

describe('stringToColor', () => {
  it('should return a valid HSL color string', () => {
    const color = stringToColor('Engineering');
    expect(color).toMatch(/^hsl\(\d+, 65%, 55%\)$/);
  });

  it('should return consistent colors for the same input', () => {
    const color1 = stringToColor('DevOps');
    const color2 = stringToColor('DevOps');
    expect(color1).toBe(color2);
  });

  it('should return different colors for different inputs', () => {
    const color1 = stringToColor('Engineering');
    const color2 = stringToColor('Design');
    expect(color1).not.toBe(color2);
  });
});

// ---------- debounce ----------

describe('debounce', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('should cancel previous calls on rapid invocations', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('should pass arguments to the debounced function', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('hello', 'world');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('hello', 'world');

    vi.useRealTimers();
  });
});
