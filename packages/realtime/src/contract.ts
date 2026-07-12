/**
 * Wire contract shared by every JebDekho web client.
 *
 * This mirrors the server definitions in
 * `apps/api/src/common/websocket/ws-rooms.ts` and the per-module `*.events.ts`
 * files. The API does not consume workspace packages, so the two sides are kept
 * in sync by hand — change both together.
 */

export const REALTIME_NAMESPACES = {
  tracking: '/tracking',
  analytics: '/analytics',
  whatsapp: '/whatsapp',
  fleet: '/fleet',
  riderAssignment: '/rider-assignment',
} as const;

export type RealtimeNamespace = (typeof REALTIME_NAMESPACES)[keyof typeof REALTIME_NAMESPACES];

/** A room the client asks to join. The server proves the caller may see it. */
export type RoomScope =
  | { type: 'order'; id: string }
  | { type: 'store'; id: string }
  | { type: 'rider'; id: string }
  | { type: 'buyer'; id: string }
  | { type: 'product'; id: string }
  | { type: 'admin-fleet' }
  | { type: 'fleet-ops' }
  | { type: 'control-room' }
  | { type: 'whatsapp-inbox' };

/** Stable identity for a scope, used to de-duplicate overlapping subscribers. */
export function scopeKey(scope: RoomScope): string {
  return 'id' in scope ? `${scope.type}:${scope.id}` : scope.type;
}

export const TRACKING_EVENTS = {
  LOCATION_UPDATED: 'rider.location.updated',
  ORDER_LOCATION_UPDATED: 'order.location.updated',
  ETA_UPDATED: 'delivery.eta.updated',
  STARTED: 'delivery.started',
  ARRIVED: 'delivery.arrived',
  COMPLETED: 'delivery.completed',
  ORDER_STATUS: 'order.status.updated',
  FLEET_UPDATED: 'fleet.updated',
} as const;

export const ORDER_EVENTS = {
  CREATED: 'order.created',
  STATUS_UPDATED: 'order.status.updated',
} as const;

export const INVENTORY_EVENTS = {
  UPDATED: 'inventory.updated',
} as const;

export const ANALYTICS_EVENTS = {
  CONTROL_ROOM_UPDATED: 'control-room.updated',
} as const;

export const WHATSAPP_EVENTS = {
  MESSAGE_RECEIVED: 'whatsapp.message.received',
  MESSAGE_STATUS_UPDATED: 'whatsapp.message.status',
} as const;

export const FLEET_EVENTS = {
  CLUSTER_UPDATED: 'fleet.cluster.updated',
  BATCH_CREATED: 'fleet.batch.created',
  BATCH_UPDATED: 'fleet.batch.updated',
  ALERT_CREATED: 'fleet.alert.created',
  ROUTE_OPTIMIZED: 'route.optimized',
} as const;

export const ASSIGNMENT_EVENTS = {
  ASSIGNED: 'order.assigned',
  REASSIGNED: 'order.reassigned',
  UNASSIGNED: 'order.unassigned',
  LOCATION_UPDATED: 'rider.location.updated',
} as const;

/** Every server emit is wrapped in this envelope. */
export interface RealtimeEnvelope {
  event: string;
  at: string;
  orderId?: string;
  storeId?: string;
  riderProfileId?: string;
  [key: string]: unknown;
}

export interface OrderCreatedPayload extends RealtimeEnvelope {
  orderId: string;
  storeId: string;
  orderNumber?: string;
  total?: number;
}

export interface InventoryUpdatedPayload extends RealtimeEnvelope {
  productId: string;
  storeId: string;
  stock: number;
  inStock: boolean;
}
