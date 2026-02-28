import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useRBAC } from '@/hooks/useRBAC';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import ErrorLogsImg from '@/assets/illustrations/error_logs.png';

type QStashEvent = {
  time: number;
  messageId: string;
  state: string;
  error?: string;
  nextDeliveryTime?: number;
  url: string;
  topicName?: string;
  endpointName?: string;
};

export function QueueLogs() {
  const { } = useRBAC();

  const { data: events, isLoading, error, refetch } = useQuery<QStashEvent[]>({
    queryKey: ['queue-logs'],
    queryFn: async () => {
      // In a production app, hitting QStash directly exposes the token to the client.
      // We do this here strictly to bypass the Vercel Hobby limits on serverless endpoints.
      const QSTASH_TOKEN = import.meta.env.VITE_QSTASH_TOKEN;
      if (!QSTASH_TOKEN) throw new Error('VITE_QSTASH_TOKEN is missing in environment variables');

      const res = await fetch('https://qstash.upstash.io/v2/events', {
        headers: {
          Authorization: `Bearer ${QSTASH_TOKEN}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch queue logs from Upstash');
      }

      // Upstash events API returns an object with an `events` array
      const data = await res.json();
      return data.events || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Queue Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor background jobs and notification events processed by Upstash QStash.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="p-8 space-y-4"
            >
              <div className="flex gap-4">
                 <Skeleton height={20} className="w-1/4" />
                 <Skeleton height={20} className="w-1/4" />
                 <Skeleton height={20} className="w-1/4 border-r-0" />
              </div>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
            >
              <EmptyState 
                title="Failed to Load Logs" 
                description="We couldn't retrieve the queue logs from Upstash. Ensure you have admin access, the VITE_QSTASH_TOKEN is set, and check your network connection."
                imageUrl={ErrorLogsImg}
                action={{
                  label: "Retry Connection",
                  onClick: () => refetch()
                }}
              />
            </motion.div>
          ) : events?.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-12 text-center text-text-muted"
            >
               No events found in the last few hours.
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-muted/50 text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Message ID</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Endpoint</th>
                    <th className="px-4 py-3 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {events?.map((event, i) => (
                      <motion.tr 
                        key={`${event.messageId}-${event.time}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-bg-muted/30"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-text-primary">
                          {new Date(event.time).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                          {event.messageId}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              event.state === 'DELIVERED'
                                ? 'bg-success/20 text-success'
                                : event.state === 'FAILED' || event.state === 'ERROR'
                                ? 'bg-error/20 text-error'
                                : 'bg-warning/20 text-warning'
                            }`}
                          >
                            {event.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary truncate max-w-[200px]" title={event.url}>
                          {event.url}
                        </td>
                        <td className="px-4 py-3 text-error truncate max-w-[200px]" title={event.error}>
                          {event.error || '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
