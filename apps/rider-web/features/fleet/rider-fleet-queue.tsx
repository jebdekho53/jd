'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'lucide-react';
import { getFleetQueue, getFleetRoute, type FleetBatchItem } from '@/lib/api';
import { mapsHref } from '@/lib/rider-helpers';
import { EmptyState, Metric, Panel, Stop } from '@/design-system/primitives';

function pretty(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** deliveryAddress is a free-form JSON blob — render whatever of it exists. */
function formatAddress(address: Record<string, string> | null) {
  if (!address) return null;
  return [address.line1, address.line2, address.landmark, address.city, address.pincode]
    .filter(Boolean)
    .join(', ');
}

export function RiderFleetQueue() {
  const queue = useQuery({ queryKey: ['rider', 'fleet', 'queue'], queryFn: getFleetQueue });
  const route = useQuery({ queryKey: ['rider', 'fleet', 'route'], queryFn: getFleetRoute });

  const batch = queue.data?.currentBatch ?? null;

  if (queue.isLoading) return <p className="text-sm text-rider-muted">Loading your batch…</p>;
  if (queue.isError) {
    return <EmptyState title="Could not load your batch" body="Check your connection and try again." />;
  }
  if (!batch || batch.items.length === 0) {
    return (
      <EmptyState
        title="No active batch"
        body="When operations groups several deliveries for you, the pickup and drop sequence appears here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Panel title={`Batch · ${pretty(batch.status)}`}>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Stops" value={String(batch.items.length)} />
          <Metric
            label="Distance"
            value={route.data ? `${route.data.distanceKm.toFixed(1)} km` : '—'}
          />
          <Metric
            label="Est. time"
            value={route.data ? `${route.data.estimatedMinutes} min` : '—'}
          />
        </div>
        <p className="mt-3 text-xs text-rider-muted">
          {route.isLoading
            ? 'Loading route…'
            : !route.data
              ? 'No optimized route has been computed for this batch yet — follow the sequence below.'
              : route.data.optimized
                ? 'Route optimized. Following the sequence below keeps the estimate accurate.'
                : 'Route not optimized yet — distance and time are a rough estimate.'}
        </p>
      </Panel>

      <Panel title="Stop sequence">
        <ol className="space-y-3">
          {batch.items.map((item) => (
            <BatchStop key={item.id} item={item} />
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function BatchStop({ item }: { item: FleetBatchItem }) {
  const { order } = item;
  const store = order.store;
  const address = formatAddress(order.deliveryAddress);
  const isCod = order.paymentMethod?.toUpperCase().includes('COD');
  const hasStoreGeo = store?.latitude != null && store?.longitude != null;
  const hasDropGeo = order.deliveryLat != null && order.deliveryLng != null;

  return (
    <li className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rider-accent text-xs font-black text-rider-accent-foreground">
            {item.sequence}
          </span>
          <Link href={`/orders/${order.id}`} className="font-bold text-rider-text">
            {order.orderNumber}
          </Link>
        </span>
        <span className="text-xs font-semibold text-rider-muted">{pretty(order.status)}</span>
      </div>

      <div className="mt-3 space-y-2">
        <Stop label="Pick up" title={store?.name ?? 'Store'} tone="store" />
        <Stop label="Drop" title={address ?? 'Address on the order'} tone="customer" />
      </div>

      {isCod && (
        <p className="mt-2 rounded-lg bg-rider-accent/10 px-2 py-1 text-xs font-bold text-rider-accent">
          Collect cash at this stop
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <NavLink
          label="To store"
          href={hasStoreGeo ? mapsHref(store!.latitude!, store!.longitude!) : null}
        />
        <NavLink
          label="To customer"
          href={hasDropGeo ? mapsHref(order.deliveryLat!, order.deliveryLng!) : null}
        />
      </div>
    </li>
  );
}

function NavLink({ label, href }: { label: string; href: string | null }) {
  if (!href) {
    return (
      <span className="flex h-10 items-center justify-center rounded-xl bg-white/5 text-xs font-semibold text-rider-muted">
        {label} — no location
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rider-info text-xs font-bold text-rider-bg"
    >
      <Navigation className="h-3.5 w-3.5" aria-hidden /> {label}
    </a>
  );
}
