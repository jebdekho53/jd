'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { DeliveryMap } from '@/features/tracking/delivery-map';
import { DeliveryProgressTracker } from '@/features/tracking/delivery-progress-tracker';
import { useDeliveryTracking } from '@/features/tracking/use-delivery-tracking';
import { useOrderDetailQuery } from '@/hooks/use-orders';
import { RiderDeliveryPanel } from '@/features/orders/components/rider-delivery-panel';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { Skeleton } from '@/design-system/primitives';

interface OrderTrackContentProps {
  orderId: string;
}

export function OrderTrackContent({ orderId }: OrderTrackContentProps) {
  const { data: order, isLoading: orderLoading } = useOrderDetailQuery(orderId);
  const { data: tracking, isLoading: trackingLoading, error } = useDeliveryTracking(
    orderId,
    order?.status,
  );

  const loading = orderLoading || trackingLoading;

  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/orders/${orderId}`}
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted"
              aria-label="Back to order"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Live tracking</h1>
              {order && (
                <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
              )}
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : error || !tracking ? (
            <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Live tracking is available after a rider is assigned.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <DeliveryMap
                  store={{ lat: tracking.store.lat, lng: tracking.store.lng, label: 'Store' }}
                  customer={{ lat: tracking.customer.lat, lng: tracking.customer.lng, label: 'You' }}
                  rider={
                    tracking.rider?.lat != null && tracking.rider.lng != null
                      ? { lat: tracking.rider.lat, lng: tracking.rider.lng, label: 'Rider' }
                      : null
                  }
                  route={tracking.route}
                />

                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold">Delivery progress</h2>
                  <DeliveryProgressTracker stage={tracking.progressStage} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <p className="text-xs text-muted-foreground">Order status</p>
                  {order && (
                    <div className="mt-1">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  )}
                  <div className="mt-4 space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="font-medium text-brand-700">
                        {tracking.eta.etaAvailable && tracking.eta.estimatedMins != null
                          ? `~${tracking.eta.estimatedMins} min`
                          : tracking.trackingActive
                            ? 'Assigning route...'
                            : 'ETA unavailable'}
                      </p>
                    </div>
                    {tracking.eta.estimatedArrivalAt && (
                      <p className="text-xs text-muted-foreground">
                        Arrives around{' '}
                        {new Date(tracking.eta.estimatedArrivalAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {order?.delivery?.rider && (
                  <RiderDeliveryPanel orderStatus={order.status} delivery={order.delivery} />
                )}
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
