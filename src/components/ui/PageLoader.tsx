import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm text-text-muted animate-pulse">{message}</p>
    </div>
  );
}
