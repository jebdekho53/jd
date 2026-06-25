'use client';

import { MapPin, Navigation } from 'lucide-react';
import type { OrderDetail, OrderStatus } from '@/types/orders';

const POST_ASSIGNMENT_STATUSES = new Set<OrderStatus>([
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
]);

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  ARRIVED_AT_STORE: 'At store',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'On the way',
  ARRIVED_AT_CUSTOMER: 'Arrived',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

function formatVehicle(vehicleType?: string | null) {
  if (!vehicleType) return null;
  return vehicleType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function riderStatusLabel(orderStatus: OrderStatus, deliveryStatus?: string) {
  if (orderStatus === 'RIDER_ASSIGNED') return 'Rider assigned';
  if (orderStatus === 'PICKED_UP' || deliveryStatus === 'PICKED_UP') return 'Picked up';
  if (orderStatus === 'OUT_FOR_DELIVERY' || deliveryStatus === 'IN_TRANSIT') return 'Out for delivery';
  if (deliveryStatus && DELIVERY_STATUS_LABELS[deliveryStatus]) {
    return DELIVERY_STATUS_LABELS[deliveryStatus];
  }
  return 'On the way';
}

interface RiderDeliveryPanelProps {
  orderStatus: OrderStatus;
  delivery: NonNullable<OrderDetail['delivery']>;
}

export function RiderDeliveryPanel({ orderStatus, delivery }: RiderDeliveryPanelProps) {
  const rider = delivery.rider;
  if (!rider) return null;

  const showTrackingSection = POST_ASSIGNMENT_STATUSES.has(orderStatus);
  const vehicle = formatVehicle(rider.vehicleType);
  const statusLabel = riderStatusLabel(orderStatus, delivery.status);

  let etaLabel: string | null = null;
  if (showTrackingSection) {
    if (delivery.etaAvailable && delivery.estimatedMins != null) {
      etaLabel = `ETA ~${delivery.estimatedMins} min`;
    } else if (!delivery.liveTrackingAvailable && delivery.waitingForPickup) {
      etaLabel = 'Waiting for rider location';
    } else if (orderStatus === 'RIDER_ASSIGNED' && delivery.waitingForPickup) {
      etaLabel = 'Assigning route...';
    } else {
      etaLabel = 'Waiting for rider location';
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Your delivery rider</h2>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Rider</p>
          <p className="font-medium">{rider.name}</p>
        </div>

        {vehicle && (
          <div>
            <p className="text-xs text-muted-foreground">Vehicle</p>
            <p>{vehicle}</p>
          </div>
        )}

        {showTrackingSection && (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Current status</p>
              <p>{statusLabel}</p>
            </div>

            {delivery.waitingForPickup && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                Waiting for pickup
              </p>
            )}

            {etaLabel && (
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className={delivery.etaAvailable ? 'font-medium text-brand-700' : 'text-muted-foreground'}>
                  {etaLabel}
                </p>
              </div>
            )}

            {delivery.liveTrackingAvailable ? (
              <div className="flex items-center gap-2 text-brand-700">
                <Navigation className="h-4 w-4" aria-hidden />
                <span>Live tracking available</span>
              </div>
            ) : showTrackingSection ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden />
                <span>Live tracking unavailable</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
