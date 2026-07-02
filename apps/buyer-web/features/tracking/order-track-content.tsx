'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Store } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { DeliveryTrackingMap } from '@/features/tracking/delivery-tracking-map';
import { sortProviderTimeline, hasProviderTimeline } from '@/lib/tracking/provider-timeline';
import { DeliveryProgressTracker } from '@/features/tracking/delivery-progress-tracker';
import { OrderLiveStatusPanel } from '@/features/tracking/order-live-status-panel';
import { useDeliveryTracking } from '@/features/tracking/use-delivery-tracking';
import { useOrderDetailQuery } from '@/hooks/use-orders';
import { RiderDeliveryPanel } from '@/features/orders/components/rider-delivery-panel';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { Skeleton } from '@/design-system/primitives';
import { PushEnableBanner } from '@/components/pwa/push-enable-banner';

interface OrderTrackContentProps {
  orderId: string;
}

function parseDeliveryCoords(
  address: Record<string, unknown> | undefined,
): { lat: number; lng: number } | null {
  if (!address) return null;
  const lat = Number(address.lat);
  const lng = Number(address.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function formatAddressLine(address: Record<string, unknown> | undefined): string {
  if (!address) return '';
  const parts = [address.line1, address.line2, address.city, address.pincode]
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => String(p).trim());
  return parts.join(', ');
}

export function OrderTrackContent({ orderId }: OrderTrackContentProps) {
  const { data: order, isLoading: orderLoading } = useOrderDetailQuery(orderId);
  const { data: tracking, isLoading: trackingLoading } = useDeliveryTracking(
    orderId,
    order?.status,
  );

  const customerCoords = parseDeliveryCoords(order?.deliveryAddress);
  const hasLiveMap = Boolean(tracking);

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

          <PushEnableBanner />

          {orderLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : !order ? (
            <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Order not found.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
                  <p className="text-sm font-semibold text-brand-900">Order placed</p>
                  <p className="mt-0.5 text-xs text-brand-800">
                    We&apos;ll update you as your order moves through the store and to your door.
                  </p>
                </div>

                <OrderLiveStatusPanel
                  status={order.status}
                  paymentMethod={order.paymentMethod}
                  totalAmount={order.totalAmount}
                />

                {trackingLoading && !hasLiveMap ? (
                  <Skeleton className="h-64 w-full rounded-2xl" />
                ) : hasLiveMap && tracking ? (
                  <>
                    <DeliveryTrackingMap
                      store={{ lat: tracking.store.lat, lng: tracking.store.lng }}
                      customer={{ lat: tracking.customer.lat, lng: tracking.customer.lng }}
                      rider={
                        tracking.rider?.lat != null && tracking.rider.lng != null
                          ? { lat: tracking.rider.lat, lng: tracking.rider.lng }
                          : tracking.rider
                            ? { lat: tracking.store.lat, lng: tracking.store.lng }
                            : null
                      }
                      route={tracking.route}
                      hasLiveProviderLocation={tracking.hasLiveProviderLocation}
                    />

                    {hasProviderTimeline(tracking.providerTimeline) && (
                      <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <h2 className="mb-3 text-sm font-semibold">Delivery timeline</h2>
                        <ul className="space-y-3 border-l-2 border-muted pl-4">
                          {sortProviderTimeline(tracking.providerTimeline).map((e, i) => (
                            <li key={`${e.occurredAt}-${i}`} className="relative">
                              <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                              <p className="text-sm font-medium">{e.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(e.occurredAt).toLocaleString('en-IN')}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                      <h2 className="mb-3 text-sm font-semibold">Delivery progress</h2>
                      <DeliveryProgressTracker stage={tracking.progressStage} />
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold">Delivery map</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Rider will be assigned soon. Live map appears once delivery is assigned.
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{order.store.name}</p>
                          <p className="text-xs text-muted-foreground">Pickup store</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatAddressLine(order.deliveryAddress)}</p>
                          <p className="text-xs text-muted-foreground">Delivery address</p>
                        </div>
                      </div>
                    </div>
                    {customerCoords && (
                      <div className="mt-4 overflow-hidden rounded-xl border">
                        <DeliveryTrackingMap
                          store={customerCoords}
                          customer={customerCoords}
                          rider={null}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <p className="text-xs text-muted-foreground">Current status</p>
                  <div className="mt-1">
                    <OrderStatusBadge status={order.status} driverName={tracking?.provider?.driverName} />
                  </div>
                  {tracking?.provider?.badgeLabel && (
                    <p className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {tracking.provider.badgeLabel}
                    </p>
                  )}
                  {tracking && (
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
                  )}
                </div>

                {order.delivery?.rider && (
                  <RiderDeliveryPanel orderStatus={order.status} delivery={order.delivery} />
                )}
                {!order.delivery?.rider && tracking?.rider && (
                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground">Delivery partner</p>
                    <p className="mt-1 font-medium">{tracking.rider.name}</p>
                    {tracking.provider?.driverPhone && (
                      <p className="text-sm text-muted-foreground">{tracking.provider.driverPhone}</p>
                    )}
                    {tracking.rider.vehicleType && (
                      <p className="text-sm text-muted-foreground">
                        {tracking.rider.vehicleType.replace(/_/g, ' ')}
                      </p>
                    )}
                    {!tracking.hasLiveProviderLocation && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Live map location unavailable — see timeline for updates.
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <p className="text-sm font-medium">Need help?</p>
                  <Link
                    href="/profile/support"
                    className="mt-2 inline-block text-sm text-brand-700 underline"
                  >
                    Contact support
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
