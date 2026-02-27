/**
 * UI Component Library — Barrel Export
 * Provides a single import point for all shared UI primitives.
 *
 * Usage: import { Button, Card, CardHeader, Input, Badge } from '@/components/ui';
 */

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Skeleton, MetricCardSkeleton, TableRowSkeleton } from './Skeleton';

export { StatusBadge } from './StatusBadge';

export { EmptyState } from './EmptyState';

export { ThemeSwitcher } from './ThemeSwitcher';

export { LanguageSwitcher } from './LanguageSwitcher';

export { SystemHealthTicker } from './SystemHealthTicker';

export { Header } from './Header';

export { Sidebar } from './Sidebar';
export type { ViewId } from './Sidebar';
