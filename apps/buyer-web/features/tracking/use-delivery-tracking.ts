'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  REALTIME_NAMESPACES,
  TRACKING_EVENTS,
  useRealtime,
  type RealtimeEnvelope,
  type RoomScope,
} from '@jebdekho/realtime';
import { getOrderTracking } from '@/services/orders/tracking-api';
import type { LiveTrackingData } from '@/types/tracking';

const TRACKABLE = new Set(['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']);

/** Polling is only a safety net while the socket is down. */
const LIVE_POLL_MS = 60_000;
const OFFLINE_POLL_MS = 15_000;

/** Shape of the tracking events the gateway pushes for an order. */
interface TrackingEnvelope extends RealtimeEnvelope {
  orderId: string;
  lat?: number;
  lng?: number;
  heading?: number | null;
  speed?: number | null;
  estimatedMins?: number | null;
  estimatedArrivalAt?: string | null;
  orderStatus?: string;
  deliveryStatus?: string;
}

export function useDeliveryTracking(orderId: string, orderStatus?: string) {
  const enabled = Boolean(orderId) && Boolean(orderStatus && TRACKABLE.has(orderStatus));
  const qc = useQueryClient();
  const queryKey = ['tracking', orderId];

  /**
   * Rider GPS arrives every few seconds. Refetching the whole tracking document
   * on each ping turns a cheap socket message into an HTTP round trip, so the
   * marker position is patched straight into the cache instead.
   */
  const patchLocation = useCallback(
    (payload: TrackingEnvelope) => {
      if (payload.orderId !== orderId) return;

      qc.setQueryData(queryKey, (prev: LiveTrackingData | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          rider: prev.rider
            ? {
                ...prev.rider,
                lat: payload.lat ?? prev.rider.lat,
                lng: payload.lng ?? prev.rider.lng,
                heading: payload.heading ?? prev.rider.heading,
                speed: payload.speed ?? prev.rider.speed,
                lastLocationAt: payload.at,
              }
            : prev.rider,
          eta: {
            ...prev.eta,
            estimatedMins: payload.estimatedMins ?? prev.eta.estimatedMins,
            estimatedArrivalAt: payload.estimatedArrivalAt ?? prev.eta.estimatedArrivalAt,
          },
        };
      });
    },
    // `queryKey` is derived from orderId; listing it would churn every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId, qc],
  );

  /** Status transitions change more than we can safely patch — refetch. */
  const invalidate = useCallback(
    (payload: TrackingEnvelope) => {
      if (payload.orderId && payload.orderId !== orderId) return;
      void qc.invalidateQueries({ queryKey });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId, qc],
  );

  const scopes: RoomScope[] = orderId ? [{ type: 'order', id: orderId }] : [];

  const { connected } = useRealtime({
    namespace: REALTIME_NAMESPACES.tracking,
    enabled,
    scopes,
    on: {
      [TRACKING_EVENTS.LOCATION_UPDATED]: patchLocation,
      [TRACKING_EVENTS.ORDER_LOCATION_UPDATED]: patchLocation,
      [TRACKING_EVENTS.ETA_UPDATED]: patchLocation,
      [TRACKING_EVENTS.STARTED]: invalidate,
      [TRACKING_EVENTS.ARRIVED]: invalidate,
      [TRACKING_EVENTS.COMPLETED]: invalidate,
      [TRACKING_EVENTS.ORDER_STATUS]: invalidate,
    },
  });

  const query = useQuery({
    queryKey,
    queryFn: () => getOrderTracking(orderId),
    enabled,
    refetchInterval: enabled ? (connected ? LIVE_POLL_MS : OFFLINE_POLL_MS) : false,
    staleTime: 2_000,
  });

  return { ...query, connected };
}
