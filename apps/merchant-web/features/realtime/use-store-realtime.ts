'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  INVENTORY_EVENTS,
  ORDER_EVENTS,
  REALTIME_NAMESPACES,
  TRACKING_EVENTS,
  useRealtime,
  type InventoryUpdatedPayload,
  type OrderCreatedPayload,
  type RoomScope,
} from '@jebdekho/realtime';

export interface StoreRealtimeResult {
  /** False while the socket is down — callers should keep polling. */
  connected: boolean;
  /** Newest order pushed since mount, for a toast/sound. Clear it once shown. */
  newOrder: OrderCreatedPayload | null;
  clearNewOrder: () => void;
}

/**
 * Live store board for a merchant: new orders, status transitions, stock moves.
 *
 * Everything the server pushes is treated as an invalidation signal rather than
 * a state patch — React Query stays the single source of truth, so a dropped or
 * out-of-order event can never leave the board showing something the API does
 * not agree with. Payload data is used only for the transient toast.
 */
export function useStoreRealtime(storeId?: string): StoreRealtimeResult {
  const qc = useQueryClient();
  const [newOrder, setNewOrder] = useState<OrderCreatedPayload | null>(null);

  const invalidateOrders = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['orders'] });
  }, [qc]);

  const scopes: RoomScope[] = storeId ? [{ type: 'store', id: storeId }] : [];

  const { connected } = useRealtime({
    namespace: REALTIME_NAMESPACES.tracking,
    enabled: Boolean(storeId),
    scopes,
    on: {
      [ORDER_EVENTS.CREATED]: (payload: OrderCreatedPayload) => {
        setNewOrder(payload);
        invalidateOrders();
      },
      [TRACKING_EVENTS.ORDER_STATUS]: invalidateOrders,
      [TRACKING_EVENTS.COMPLETED]: invalidateOrders,
      [INVENTORY_EVENTS.UPDATED]: (payload: InventoryUpdatedPayload) => {
        void qc.invalidateQueries({ queryKey: ['products'] });
        void qc.invalidateQueries({ queryKey: ['inventory', payload.productId] });
      },
    },
  });

  const clearNewOrder = useCallback(() => setNewOrder(null), []);

  return { connected, newOrder, clearNewOrder };
}
