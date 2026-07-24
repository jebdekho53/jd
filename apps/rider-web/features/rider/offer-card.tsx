'use client';

import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import { useCountdownSeconds } from '@/lib/use-countdown-seconds';
import type { RiderOrder } from '@/lib/api';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** The single most recognizable pattern in Zomato/Blinkit/Zepto rider apps:
 *  a forced-choice, high-urgency offer card with a live countdown, shown the
 *  instant an order is assigned — instead of it looking like just another
 *  row in a list. */
export function OfferCard({
  order,
  busy,
  onAccept,
  onDecline,
}: {
  order: RiderOrder;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const secondsLeft = useCountdownSeconds(order.expiresAt);
  const urgent = secondsLeft != null && secondsLeft <= 10;

  return (
    <div
      className={`overflow-hidden rounded-3xl border-2 bg-rider-surface shadow-pop transition ${
        urgent ? 'border-rider-danger animate-pulse-ring' : 'border-rider-accent'
      }`}
    >
      <div className="flex items-center justify-between bg-rider-accent px-4 py-2 text-rider-accent-foreground">
        <p className="text-sm font-black uppercase tracking-wide">New delivery offer</p>
        {secondsLeft != null && (
          <p className={`rider-num text-lg font-black ${urgent ? 'text-rider-danger' : ''}`}>{secondsLeft}s</p>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rider-muted">You earn</p>
            <p className="rider-num text-4xl font-black leading-none text-rider-accent">
              {order.riderEarning != null ? inr(order.riderEarning) : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-rider-muted">Payment</p>
            <p className="font-bold text-rider-text">
              {order.paymentMethod?.toUpperCase().includes('COD') ? `COD ${inr(order.totalAmount)}` : 'Prepaid'}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-rider-bg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rider-info" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-rider-muted">Pickup</p>
              <p className="truncate font-semibold text-rider-text">{order.storeName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-rider-muted">Drop</p>
              <p className="truncate font-semibold text-rider-text">{order.customerArea}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={onDecline} disabled={busy}>
            Decline
          </Button>
          <Button variant="primary" size="lg" onClick={onAccept} disabled={busy}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
