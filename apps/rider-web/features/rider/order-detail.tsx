'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigation } from 'lucide-react';
import { getOrder, verifyDeliveryAction, verifyPickupAction } from '@/lib/api';
import { formatAddress, isNewOffer, nextAction, pretty } from '@/lib/rider-format';
import { mapsHref } from '@/lib/rider-helpers';
import { Button, EmptyState, Panel, Stop } from '@/design-system/primitives';
import { OfferCard } from './offer-card';
import { OrderCard, HeroStatCard } from './order-card';
import { HandoverOtpForm } from './handover-otp-form';
import { useOrderActions } from './use-order-actions';

export function OrderDetail({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [failReasonOpen, setFailReasonOpen] = useState(false);
  const [failReason, setFailReason] = useState('');
  const detail = useQuery({ queryKey: ['rider', 'order', orderId], queryFn: () => getOrder(orderId) });
  const { action, reject, fail, busy } = useOrderActions();
  const order = detail.data;

  const refreshOrder = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['rider', 'order', orderId] }),
      qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
      qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
      qc.invalidateQueries({ queryKey: ['rider', 'finance'] }),
    ]);
  };

  const verifyPickupMut = useMutation({
    mutationFn: (otp: string) => verifyPickupAction(orderId, otp),
    onSuccess: refreshOrder,
  });
  const verifyDeliveryMut = useMutation({
    mutationFn: ({ otp, codCollected }: { otp: string; codCollected: boolean }) =>
      verifyDeliveryAction(orderId, otp, codCollected),
    onSuccess: refreshOrder,
  });

  if (detail.isLoading) return <EmptyState title="Loading order" body="Opening the delivery details." />;
  if (detail.isError || !order) {
    return <EmptyState title="Order unavailable" body="This delivery could not be loaded." />;
  }

  if (isNewOffer(order.deliveryStatus)) {
    return (
      <div className="space-y-3">
        <BackLink />
        <OfferCard
          order={order}
          busy={busy}
          onAccept={() => action.mutate({ orderId: order.orderId, verb: 'accept' })}
          onDecline={() =>
            reject.mutate(
              { orderId: order.orderId, reason: 'Declined by rider' },
              { onSuccess: () => router.push('/orders') },
            )
          }
        />
      </div>
    );
  }

  const step = nextAction(order.deliveryStatus);
  const showPickupOtp =
    order.deliveryStatus === 'ARRIVED_AT_STORE' && order.pickupOtpRequired && !order.pickupVerified;
  const showDeliveryOtp =
    order.deliveryStatus === 'ARRIVED_AT_CUSTOMER' &&
    order.deliveryOtpRequired &&
    !order.deliveryVerified;
  const dropoff = ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_CUSTOMER'].includes(order.deliveryStatus);
  const navTarget = dropoff
    ? { lat: order.customerLat, lng: order.customerLng }
    : { lat: order.storeLat, lng: order.storeLng };
  const canFail = !['DELIVERED', 'FAILED', 'CANCELLED'].includes(order.deliveryStatus);

  return (
    <div className="space-y-3">
      <BackLink />
      <OrderCard order={order} />

      {(order.distanceKm != null || order.estimatedMins != null) && (
        <div className="grid grid-cols-2 gap-3">
          {order.distanceKm != null && (
            <HeroStatCard label="Distance" value={order.distanceKm.toFixed(1)} unit="km" />
          )}
          {order.estimatedMins != null && (
            <HeroStatCard label="ETA" value={String(order.estimatedMins)} unit="min" />
          )}
        </div>
      )}

      <Panel title="Route">
        <Stop label="Pickup" title={order.storeName} subtitle={order.storeAddress} tone="store" />
        <Stop
          label="Drop"
          title={order.customerArea}
          subtitle={formatAddress(order.deliveryAddress)}
          tone="customer"
        />
        {order.buyerNote && (
          <p className="rounded-xl bg-rider-accent/10 p-3 text-sm text-rider-text">
            Customer note: {order.buyerNote}
          </p>
        )}
        <a
          href={mapsHref(navTarget.lat, navTarget.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-rider-info text-sm font-bold text-rider-bg"
        >
          <Navigation className="h-4 w-4" aria-hidden /> Navigate
        </a>
      </Panel>

      <Panel title="Items">
        {order.items.length === 0 ? (
          <p className="text-sm text-rider-muted">No item details available.</p>
        ) : (
          <ul className="space-y-2">
            {order.items.map((item, idx) => (
              <li key={`${item.name}-${idx}`} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.name}
                  {item.variant ? ` (${item.variant})` : ''}
                </span>
                <b>x{item.quantity}</b>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Timeline">
        <ol className="space-y-2">
          {order.timeline.length === 0 ? (
            <li className="text-sm text-rider-muted">No timeline yet.</li>
          ) : (
            order.timeline.map((t) => (
              <li key={`${t.status}-${t.at}`} className="flex justify-between gap-3 text-sm">
                <span>{pretty(t.status)}</span>
                <span className="text-rider-muted">{new Date(t.at).toLocaleString('en-IN')}</span>
              </li>
            ))
          )}
        </ol>
      </Panel>

      <Link
        href={`/support?orderId=${encodeURIComponent(order.orderId)}`}
        className="block w-full text-center text-sm font-semibold text-rider-muted underline"
      >
        Report an issue with this order
      </Link>

      {showPickupOtp ? (
        <HandoverOtpForm
          kind="pickup"
          busy={verifyPickupMut.isPending}
          error={verifyPickupMut.error instanceof Error ? verifyPickupMut.error.message : null}
          onSubmit={(otp) => verifyPickupMut.mutate(otp)}
        />
      ) : showDeliveryOtp ? (
        <HandoverOtpForm
          kind="delivery"
          codDue={Boolean(order.codDue)}
          codAmount={order.codAmount ?? null}
          busy={verifyDeliveryMut.isPending}
          error={verifyDeliveryMut.error instanceof Error ? verifyDeliveryMut.error.message : null}
          onSubmit={(otp, codCollected) => verifyDeliveryMut.mutate({ otp, codCollected })}
        />
      ) : (
        step && (
          <Button size="lg" onClick={() => action.mutate({ orderId: order.orderId, verb: step.verb })} disabled={busy}>
            {step.label}
          </Button>
        )
      )}

      {canFail &&
        !showPickupOtp &&
        !showDeliveryOtp &&
        (failReasonOpen ? (
          <div className="space-y-2 rounded-2xl border border-rider-danger/40 bg-rider-danger/10 p-3">
            <p className="text-sm font-bold text-rider-text">Why did this delivery fail?</p>
            <textarea
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="e.g. Customer unreachable, wrong address..."
              className="min-h-20 w-full rounded-xl border border-rider-border bg-rider-surface p-3 text-sm text-rider-text"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setFailReasonOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={busy || failReason.trim().length === 0}
                onClick={() => {
                  fail.mutate({ orderId: order.orderId, reason: failReason.trim() });
                  setFailReasonOpen(false);
                  setFailReason('');
                }}
              >
                Confirm failed
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setFailReasonOpen(true)} disabled={busy}>
            Mark delivery failed
          </Button>
        ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/orders" className="block text-sm font-bold text-rider-muted">
      ← Back to orders
    </Link>
  );
}
