'use client';

import Link from 'next/link';
import type { RiderOrder } from '@/lib/api';
import { inr, pretty } from '@/lib/rider-format';
import { StatusBadge, Stop } from '@/design-system/primitives';

export function OrderCard({ order, compact = false }: { order: RiderOrder; compact?: boolean }) {
  const isCod = order.paymentMethod?.toUpperCase().includes('COD');
  return (
    <div className="overflow-hidden rounded-2xl border border-rider-border bg-rider-surface">
      <div className="flex items-center justify-between border-b border-rider-border px-4 py-3">
        <b className="text-rider-text">#{order.orderNumber}</b>
        <StatusBadge status={order.deliveryStatus} label={pretty(order.deliveryStatus)} />
      </div>
      <div className="space-y-2 p-4 text-sm">
        <Stop label="Pickup" title={order.storeName} tone="store" />
        <Stop label="Drop" title={order.customerArea} tone="customer" />
        {!compact && (
          <div className="flex justify-between gap-3 pt-2">
            <span className="text-rider-muted">
              {isCod ? `Collect ${inr(order.totalAmount)} COD` : 'Prepaid order'}
            </span>
            {order.riderEarning != null && <b className="text-rider-online">{inr(order.riderEarning)}</b>}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroStatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-rider-border bg-rider-surface p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-rider-muted">{label}</p>
      <p className="rider-num mt-1 text-2xl font-black text-rider-text">
        {value}
        <span className="ml-1 text-sm font-bold text-rider-muted">{unit}</span>
      </p>
    </div>
  );
}

export function ToolLink({ href, label, alert = false }: { href: string; label: string; alert?: boolean }) {
  return (
    <Link href={href} className="relative rounded-xl bg-white/5 px-3 py-3 font-semibold text-rider-text">
      {label}
      {alert && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rider-danger" />}
    </Link>
  );
}
