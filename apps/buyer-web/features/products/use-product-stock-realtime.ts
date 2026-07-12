'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  INVENTORY_EVENTS,
  REALTIME_NAMESPACES,
  useRealtime,
  type InventoryUpdatedPayload,
  type RoomScope,
} from '@jebdekho/realtime';
import { buyerKeys } from '@/services/buyer/buyer-api';

/**
 * Keeps a product page's stock state honest while the buyer is looking at it,
 * so they do not add a just-sold-out item to the cart and only discover it at
 * checkout.
 *
 * The `product:<id>` room is open to any authenticated session — stock is
 * already public on the storefront — but the socket still needs a token, so an
 * anonymous visitor simply never connects and falls back to the normal fetch.
 */
export function useProductStockRealtime(productId?: string): { connected: boolean } {
  const qc = useQueryClient();

  const onStockChange = useCallback(
    (payload: InventoryUpdatedPayload) => {
      if (!productId || payload.productId !== productId) return;
      // Prefix match: the full key also carries a store slug, which varies by
      // the route the buyer arrived through.
      void qc.invalidateQueries({ queryKey: [...buyerKeys.all, 'product', productId] });
    },
    [productId, qc],
  );

  const scopes: RoomScope[] = productId ? [{ type: 'product', id: productId }] : [];

  const { connected } = useRealtime({
    namespace: REALTIME_NAMESPACES.tracking,
    enabled: Boolean(productId),
    scopes,
    on: { [INVENTORY_EVENTS.UPDATED]: onStockChange },
  });

  return { connected };
}
