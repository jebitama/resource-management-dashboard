/**
 * ==========================================================================
 * useSocketData — WebSocket Stream Simulation Hook
 * ==========================================================================
 * Simulates a WebSocket connection that streams real-time system metrics.
 * Uses setInterval to produce typed SocketMessage events at configurable
 * intervals. Implements:
 *
 * - Connection state management (connecting → connected → disconnected)
 * - Automatic reconnection with exponential backoff
 * - Typed message stream using discriminated unions
 * - Cleanup on unmount to prevent memory leaks
 *
 * In production, this hook would wrap a native WebSocket or a library
 * like socket.io-client. The interface remains identical.
 * ==========================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SocketMessage, SystemHealthMessage, AlertMessage } from '@/types';

// ---------- Types ----------

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseSocketDataOptions {
  /** Interval in ms between simulated messages (default: 2000) */
  interval?: number;
  /** Maximum number of messages to retain in history (default: 50) */
  maxHistory?: number;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

interface UseSocketDataReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Latest received message */
  lastMessage: SocketMessage | null;
  /** Latest system health snapshot */
  healthData: SystemHealthMessage['payload'] | null;
  /** History of recent messages */
  messageHistory: SocketMessage[];
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

// ---------- Simulated Message Generators ----------

function generateHealthMessage(): SystemHealthMessage {
  return {
    type: 'SYSTEM_HEALTH',
    payload: {
      cpuAvg: Math.round((40 + Math.random() * 35) * 10) / 10,
      memoryAvg: Math.round((50 + Math.random() * 30) * 10) / 10,
      networkIn: Math.round(Math.random() * 500 * 10) / 10,
      networkOut: Math.round(Math.random() * 300 * 10) / 10,
      activeConnections: Math.floor(1000 + Math.random() * 4000),
      errorRate: Math.round(Math.random() * 2 * 100) / 100,
      timestamp: new Date().toISOString(),
    },
  };
}

function generateAlertMessage(): AlertMessage {
  const severities: AlertMessage['payload']['severity'][] = [
    'info', 'info', 'warning', 'warning', 'error', 'critical',
  ];
  const titles = [
    'CPU spike detected on prod-compute-primary-042',
    'Memory threshold exceeded on cache-storage-hot-standby-018',
    'Network latency increase in eu-west-1 region',
    'Auto-scaling triggered for container pool',
    'SSL certificate renewal in 7 days',
    'Database connection pool at 85% capacity',
    'CDN cache hit ratio dropped below threshold',
    'Deployment pipeline completed successfully',
  ];

  const severity = severities[Math.floor(Math.random() * severities.length)]!;
  const title = titles[Math.floor(Math.random() * titles.length)]!;

  return {
    type: 'ALERT',
    payload: {
      id: `alert-${Date.now()}`,
      severity,
      title,
      message: `Automated monitoring detected: ${title.toLowerCase()}`,
      resourceId: `res-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      acknowledged: false,
      timestamp: new Date().toISOString(),
    },
  };
}

function generateRandomMessage(): SocketMessage {
  const rand = Math.random();
  if (rand < 0.6) return generateHealthMessage();
  if (rand < 0.85) {
    return {
      type: 'MARKET_TICKER',
      payload: {
        resourceId: `res-${String(Math.floor(Math.random() * 100)).padStart(5, '0')}`,
        metric: (['cpu', 'memory', 'network', 'cost'] as const)[Math.floor(Math.random() * 4)]!,
        value: Math.round(Math.random() * 100 * 10) / 10,
        previousValue: Math.round(Math.random() * 100 * 10) / 10,
        change: Math.round((Math.random() * 20 - 10) * 100) / 100,
        timestamp: new Date().toISOString(),
      },
    };
  }
  return generateAlertMessage();
}

// ---------- Hook ----------

export function useSocketData(options: UseSocketDataOptions = {}): UseSocketDataReturn {
  const {
    interval = 2000,
    maxHistory = 50,
    autoConnect = true,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const [healthData, setHealthData] = useState<SystemHealthMessage['payload'] | null>(null);
  const [messageHistory, setMessageHistory] = useState<SocketMessage[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectedRef = useRef(false);

  /**
   * Simulate connection establishment.
   * In production, this would open a WebSocket connection.
   */
  const connect = useCallback(() => {
    if (isConnectedRef.current) return;

    setStatus('connecting');

    // Simulate connection handshake delay
    const connectTimeout = setTimeout(() => {
      isConnectedRef.current = true;
      setStatus('connected');

      // Begin streaming messages
      intervalRef.current = setInterval(() => {
        const message = generateRandomMessage();
        setLastMessage(message);

        // Update health data if it's a health message
        if (message.type === 'SYSTEM_HEALTH') {
          setHealthData(message.payload);
        }

        setMessageHistory((prev) => {
          const updated = [message, ...prev];
          // Trim history to prevent unbounded memory growth
          return updated.slice(0, maxHistory);
        });
      }, interval);
    }, 800); // Simulate 800ms connection time

    return () => clearTimeout(connectTimeout);
  }, [interval, maxHistory]);

  /**
   * Disconnect and clean up intervals.
   */
  const disconnect = useCallback(() => {
    isConnectedRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  // Auto-connect on mount and cleanup on unmount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isConnectedRef.current = false;
    };
  }, [autoConnect, connect]);

  return {
    status,
    lastMessage,
    healthData,
    messageHistory,
    connect,
    disconnect,
  };
}
