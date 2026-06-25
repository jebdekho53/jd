'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderTracking } from '@/services/orders/tracking-api';
import type { LiveTrackingData } from '@/types/tracking';

const TRACKABLE = new Set(['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']);

import { getTrackingWsBase } from '@jebdekho/web-config';

function trackingWsBase(): string {
  return getTrackingWsBase();
}

export function useDeliveryTracking(orderId: string, orderStatus?: string) {
  const enabled = Boolean(orderId) && Boolean(orderStatus && TRACKABLE.has(orderStatus));
  const qc = useQueryClient();
  const socketRef = useRef<{ disconnect: () => void } | null>(null);

  const query = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
    staleTime: 2_000,
  });

  useEffect(() => {
    if (!enabled || !orderId) return;

    let cancelled = false;

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const socket = io(`${trackingWsBase()}/tracking`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('subscribe', { namespace: 'buyer', id: orderId, orderId });
        });

        const refresh = (payload?: Partial<LiveTrackingData>) => {
          if (payload?.orderId === orderId) {
            qc.setQueryData(['tracking', orderId], (prev: LiveTrackingData | undefined) =>
              prev ? { ...prev, ...payload, updatedAt: new Date().toISOString() } : prev,
            );
          }
          void qc.invalidateQueries({ queryKey: ['tracking', orderId] });
        };

        socket.on('rider.location.updated', refresh);
        socket.on('order.location.updated', refresh);
        socket.on('delivery.eta.updated', refresh);
        socket.on('delivery.started', refresh);
        socket.on('delivery.completed', refresh);
        socket.on('order.status.updated', refresh);
      } catch {
        // Polling fallback only
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled, orderId, qc]);

  return query;
}
