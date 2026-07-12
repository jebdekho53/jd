'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { OrderCreatedPayload } from '@jebdekho/realtime';

const AUTO_DISMISS_MS = 15_000;

/**
 * Short chime synthesised in-browser, so there is no audio asset to ship or
 * cache. Browsers block audio until the user has interacted with the page; that
 * is fine — the visual alert is the primary signal and the sound is a bonus.
 */
function playChime(): void {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => void ctx.close();
  } catch {
    // Autoplay blocked or no audio device — the toast still shows.
  }
}

interface Props {
  order: OrderCreatedPayload | null;
  onDismiss: () => void;
}

export function NewOrderAlert({ order, onDismiss }: Props) {
  const orderId = order?.orderId;

  useEffect(() => {
    if (!orderId) return;
    playChime();
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [orderId, onDismiss]);

  if (!order) return null;

  return (
    <div
      role="alert"
      className="fixed right-4 top-4 z-50 w-80 rounded-xl border border-emerald-500 bg-emerald-950 p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-300">New order</p>
          <p className="mt-1 text-lg font-bold text-white">#{order.orderNumber}</p>
          {typeof order.total === 'number' && (
            <p className="text-sm text-emerald-200">₹{order.total.toFixed(2)}</p>
          )}
          <Link
            href={`/orders/${order.orderId}`}
            onClick={onDismiss}
            className="mt-2 inline-block text-sm font-semibold text-emerald-300 underline hover:text-emerald-100"
          >
            View order
          </Link>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss new order alert"
          className="rounded p-1 text-emerald-300 hover:bg-emerald-900 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
