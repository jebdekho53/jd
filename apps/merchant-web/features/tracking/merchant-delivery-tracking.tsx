'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, Spinner } from '@/design-system/primitives';
import { merchantFetch } from '@/services/api/merchant-client';
import { DeliveryMap } from '@/features/tracking/delivery-map';
import type { LiveTrackingData } from '@/types/tracking';

const TRACKABLE = new Set(['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']);

async function fetchTracking(orderId: string) {
  const res = await merchantFetch<{ success: boolean; data: LiveTrackingData }>(
    `/api/merchant/orders/${orderId}/tracking`,
  );
  return res.data;
}

export function MerchantDeliveryTracking({ orderId, orderStatus }: { orderId: string; orderStatus: string }) {
  const enabled = TRACKABLE.has(orderStatus);
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-tracking', orderId],
    queryFn: () => fetchTracking(orderId),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
  });

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="font-semibold">Track delivery</h2>
        {data?.trackingActive && (
          <span className="text-xs text-brand-600">Live</span>
        )}
      </CardHeader>
      <CardBody className="space-y-3">
        {isLoading && <Spinner />}
        {!isLoading && !data && (
          <p className="text-sm text-slate-500">Tracking will appear when rider is assigned.</p>
        )}
        {data && (
          <>
            <DeliveryMap
              store={{ lat: data.store.lat, lng: data.store.lng }}
              customer={{ lat: data.customer.lat, lng: data.customer.lng }}
              rider={
                data.rider?.lat != null && data.rider.lng != null
                  ? { lat: data.rider.lat, lng: data.rider.lng }
                  : null
              }
              route={data.route}
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-500">ETA</p>
                <p className="font-medium">
                  {data.eta.etaAvailable && data.eta.estimatedMins != null
                    ? `~${data.eta.estimatedMins} min`
                    : 'Waiting for rider location'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Rider → store</p>
                <p className="font-medium">
                  {data.eta.riderDistanceFromStoreKm != null
                    ? `${data.eta.riderDistanceFromStoreKm.toFixed(1)} km`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Rider → customer</p>
                <p className="font-medium">
                  {data.eta.riderDistanceToCustomerKm != null
                    ? `${data.eta.riderDistanceToCustomerKm.toFixed(1)} km`
                    : '—'}
                </p>
              </div>
            </div>
            {data.rider && (
              <p className="text-sm text-slate-600">
                Rider: <span className="font-medium">{data.rider.name}</span>
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
