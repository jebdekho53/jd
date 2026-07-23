'use client';

import { MapPin, Navigation, Phone } from 'lucide-react';
import { useCountdownMins } from '@/hooks/use-countdown-mins';
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

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
  const countdownMins = useCountdownMins(delivery.estimatedArrivalAt);
  if (!rider) return null;

  const showTrackingSection = POST_ASSIGNMENT_STATUSES.has(orderStatus);
  const vehicle = formatVehicle(rider.vehicleType);
  const statusLabel = riderStatusLabel(orderStatus, delivery.status);

  // Prefer the live client-side countdown (ticks between polls); fall back to
  // the last server-reported estimate if we don't have an arrival timestamp.
  const liveMins = countdownMins ?? (delivery.etaAvailable ? delivery.estimatedMins : null);

  let etaLabel: string | null = null;
  if (showTrackingSection) {
    if (liveMins != null) {
      etaLabel = `ETA ~${liveMins} min`;
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

      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials(rider.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{rider.name}</p>
          {vehicle && <p className="text-xs text-muted-foreground">{vehicle}</p>}
        </div>
        {showTrackingSection && liveMins != null && (
          <span className="flex shrink-0 items-baseline gap-1 rounded-lg bg-primary px-2.5 py-1.5">
            <span className="text-base font-extrabold leading-none text-white">{liveMins}</span>
            <span className="text-[10px] font-bold uppercase leading-none text-white/90">min</span>
          </span>
        )}
        {rider.phone && (
          <a
            href={`tel:${rider.phone}`}
            aria-label={`Call ${rider.name}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
          >
            <Phone className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>

      <div className="space-y-3 text-sm">
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
                <p className={liveMins != null ? 'font-medium text-brand-700' : 'text-muted-foreground'}>
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
