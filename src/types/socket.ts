/**
 * ==========================================================================
 * WebSocket Message Types
 * ==========================================================================
 */

import { Resource } from './resources';

export interface SystemHealthMessage {
  readonly type: 'SYSTEM_HEALTH';
  payload: {
    cpuAvg: number;
    memoryAvg: number;
    networkIn: number;
    networkOut: number;
    activeConnections: number;
    errorRate: number;
    timestamp: string;
  };
}

export interface MarketTickerMessage {
  readonly type: 'MARKET_TICKER';
  payload: {
    resourceId: string;
    metric: 'cpu' | 'memory' | 'network' | 'cost';
    value: number;
    previousValue: number;
    change: number;
    timestamp: string;
  };
}

export interface AlertMessage {
  readonly type: 'ALERT';
  payload: {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    resourceId: string | null;
    acknowledged: boolean;
    timestamp: string;
  };
}

export interface ResourceUpdateMessage {
  readonly type: 'RESOURCE_UPDATE';
  payload: {
    resourceId: string;
    field: keyof Resource;
    oldValue: string | number;
    newValue: string | number;
    timestamp: string;
  };
}

export type SocketMessage =
  | SystemHealthMessage
  | MarketTickerMessage
  | AlertMessage
  | ResourceUpdateMessage;
