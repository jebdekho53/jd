export {
  REALTIME_NAMESPACES,
  TRACKING_EVENTS,
  ORDER_EVENTS,
  INVENTORY_EVENTS,
  ANALYTICS_EVENTS,
  WHATSAPP_EVENTS,
  FLEET_EVENTS,
  ASSIGNMENT_EVENTS,
  scopeKey,
} from './contract';

export type {
  RealtimeNamespace,
  RoomScope,
  RealtimeEnvelope,
  OrderCreatedPayload,
  InventoryUpdatedPayload,
} from './contract';

export { createBffTokenProvider, RealtimeUnauthorizedError } from './token-provider';
export type { TokenProvider } from './token-provider';

export { getConnection, resetConnections } from './connection';
export type { ConnectionStatus, ConnectionConfig, EventHandler } from './connection';

export { useRealtime } from './use-realtime';
export type { UseRealtimeOptions, UseRealtimeResult } from './use-realtime';
