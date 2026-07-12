'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ORDER_EVENTS,
  REALTIME_NAMESPACES,
  TRACKING_EVENTS,
  useRealtime,
  type RoomScope,
} from '@jebdekho/realtime';

const FLEET_SCOPES: RoomScope[] = [{ type: 'admin-fleet' }];

export interface AdminFleetRealtimeOptions {
  /** Query key prefixes to invalidate when an order changes. */
  orderKeys?: readonly unknown[][];
  enabled?: boolean;
}

/**
 * Admin-wide order and fleet feed.
 *
 * `admin-fleet` receives every order event on the platform, so this is a
 * refetch trigger rather than a cache patch — the admin board's filters and
 * pagination mean the pushed payload rarely matches what is on screen.
 */
export function useAdminFleetRealtime(options: AdminFleetRealtimeOptions = {}): {
  connected: boolean;
} {
  // Prefix keys: `['admin','orders']` covers every filtered/paginated list, and
  // `['admin-dashboard']` covers the overview counters.
  const { orderKeys = [['admin', 'orders'], ['admin-dashboard']], enabled = true } = options;
  const qc = useQueryClient();

  const invalidateOrders = useCallback(() => {
    for (const key of orderKeys) {
      void qc.invalidateQueries({ queryKey: key });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, JSON.stringify(orderKeys)]);

  const { connected } = useRealtime({
    namespace: REALTIME_NAMESPACES.tracking,
    enabled,
    scopes: FLEET_SCOPES,
    on: {
      [ORDER_EVENTS.CREATED]: invalidateOrders,
      [TRACKING_EVENTS.ORDER_STATUS]: invalidateOrders,
      [TRACKING_EVENTS.COMPLETED]: invalidateOrders,
      [TRACKING_EVENTS.STARTED]: invalidateOrders,
    },
  });

  return { connected };
}
