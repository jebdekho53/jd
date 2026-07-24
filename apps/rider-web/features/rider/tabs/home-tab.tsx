'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { getEarnings, getMe, listOrders, setStatus } from '@/lib/api';
import { inr, isActive, isNewOffer, pretty } from '@/lib/rider-format';
import { Button, EmptyState, HeroStat, Metric } from '@/design-system/primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OfferCard } from '../offer-card';
import { OrderCard } from '../order-card';
import { ReturnPickupsCard } from '../return-pickups-card';
import { useOrderActions } from '../use-order-actions';
import { useRiderGps } from '../use-rider-gps';

export function HomeTab() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const orders = useQuery({ queryKey: ['rider', 'orders'], queryFn: listOrders, refetchInterval: 15_000 });
  const earnings = useQuery({ queryKey: ['rider', 'finance', 'earnings'], queryFn: getEarnings });
  const { action, reject, busy } = useOrderActions();

  const profile = me.data?.profile;
  const approved = profile?.kycStatus === 'APPROVED';
  const restricted = Boolean(me.data?.restricted);
  const online = profile ? profile.status !== 'OFFLINE' : false;
  const gps = useRiderGps({ online, approved });

  const statusMut = useMutation({
    mutationFn: () => setStatus(online ? 'OFFLINE' : 'ONLINE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
  });

  const activeOrders = (orders.data ?? []).filter(isActive);
  const currentOrder = activeOrders[0] ?? null;
  const offerPending = currentOrder && isNewOffer(currentOrder.deliveryStatus);

  if (!online) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border-2 border-dashed border-rider-border bg-rider-surface p-6 text-center">
          <Zap className="mx-auto h-8 w-8 text-rider-accent" aria-hidden />
          <p className="mt-2 text-lg font-black">You&apos;re offline</p>
          <p className="mt-1 text-sm text-rider-muted">
            Go online to start receiving delivery offers nearby.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-4"
            onClick={() => statusMut.mutate()}
            disabled={!approved || restricted || statusMut.isPending}
          >
            {statusMut.isPending ? 'Going online...' : 'GO ONLINE'}
          </Button>
          {!approved && !restricted && (
            <p className="mt-2 text-xs text-rider-danger">Complete KYC approval before going online.</p>
          )}
          {statusMut.isError && (
            <p className="mt-2 text-xs text-rider-danger">
              {statusMut.error instanceof Error ? statusMut.error.message : 'Could not go online.'}
            </p>
          )}
        </div>
        <ReturnPickupsCard />
      </div>
    );
  }

  if (offerPending) {
    return (
      <div className="space-y-4">
        <OfferCard
          order={currentOrder}
          busy={busy}
          onAccept={() => action.mutate({ orderId: currentOrder.orderId, verb: 'accept' })}
          onDecline={() => reject.mutate({ orderId: currentOrder.orderId, reason: 'Declined by rider' })}
        />
        <ReturnPickupsCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-rider-border bg-rider-surface p-5">
        <HeroStat label="Today's earnings" value={inr(earnings.data?.today ?? 0)} accent />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Active orders" value={String(activeOrders.length)} />
        <Metric label="GPS" value={gps.state === 'watching' ? 'Live' : pretty(gps.state)} />
        <Metric
          label="Rating"
          value={`${Number(profile?.ratingAvg ?? 0).toFixed(1)} (${profile?.ratingCount ?? 0})`}
        />
        <Metric label="Status" value="Online" />
      </div>

      {currentOrder ? (
        <button onClick={() => router.push(`/orders/${currentOrder.orderId}`)} className="w-full text-left">
          <OrderCard order={currentOrder} compact />
        </button>
      ) : (
        <EmptyState
          title="Waiting for orders"
          body="Stay online. New assigned orders will appear here instantly."
        />
      )}

      <ReturnPickupsCard />
    </div>
  );
}
