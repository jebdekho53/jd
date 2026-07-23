'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { getMe, logout } from '@/lib/api';
import { pretty } from '@/lib/rider-format';
import { Info, Panel, StatusBadge } from '@/design-system/primitives';
import { ToolLink } from '../order-card';

export function AccountTab() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });

  const signOut = useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSuccess: () => {
      qc.clear();
      router.replace('/login');
    },
  });

  const p = me.data?.profile;
  const kycAction = p?.kycStatus !== 'APPROVED';
  const rating = Number(p?.ratingAvg ?? 0);
  const ratingCount = p?.ratingCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-rider-border bg-rider-surface p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-rider-accent/15 text-lg font-black text-rider-accent">
          {(p?.name ?? me.data?.user.phone ?? '?').trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-rider-text">
            {p?.name ?? me.data?.user.phone ?? '—'}
          </p>
          <p className="text-sm text-rider-muted">{me.data?.user.phone ?? '—'}</p>
        </div>
        <StatusBadge status={p?.status ?? 'OFFLINE'} label={pretty(p?.status ?? 'OFFLINE')} />
      </div>

      <Panel title="Your rating">
        {ratingCount === 0 ? (
          <p className="text-sm text-rider-muted">
            No ratings yet. Customers can rate you once you have completed deliveries.
          </p>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <p className="rider-num text-4xl font-black text-rider-text">{rating.toFixed(1)}</p>
              <div className="pb-1">
                <Stars value={rating} />
                <p className="mt-0.5 text-xs text-rider-muted">
                  from {ratingCount} rated {ratingCount === 1 ? 'delivery' : 'deliveries'}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-rider-border">
              <div
                className={`h-2 rounded-full ${rating >= 4 ? 'bg-rider-online' : rating >= 3 ? 'bg-rider-accent' : 'bg-rider-danger'}`}
                style={{ width: `${Math.min(100, (rating / 5) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-rider-muted">
              {rating >= 4.5
                ? 'Excellent standing.'
                : rating >= 4
                  ? 'Good standing.'
                  : rating >= 3
                    ? 'Below the platform average — careful handovers and on-time drops bring this up.'
                    : 'At risk. Operations may review your account at this level.'}
            </p>
          </>
        )}
      </Panel>

      <Panel title="Profile">
        <dl>
          <Info label="KYC" value={pretty(p?.kycStatus ?? 'PENDING')} />
          <Info
            label="Vehicle"
            value={p ? `${pretty(p.vehicleType)}${p.vehicleNumber ? ` · ${p.vehicleNumber}` : ''}` : 'Not set'}
          />
          <Info label="Deliveries" value={String(p?.totalDeliveries ?? 0)} />
          <Info
            label="Partner since"
            value={p ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}
          />
        </dl>
        <Link href="/account/edit" className="mt-3 inline-block text-sm font-bold text-rider-accent">
          Edit my details
        </Link>
      </Panel>

      <Link
        href="/account/bank"
        className="block w-full rounded-2xl border border-rider-border bg-rider-surface p-4 text-left"
      >
        <p className="font-bold text-rider-text">Payout account</p>
        <p className="text-sm text-rider-muted">Bank account, IFSC, and UPI details.</p>
      </Link>

      <Panel title="Captain tools">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <ToolLink href="/onboarding/status" label="Application status" alert={kycAction} />
          <ToolLink href="/kyc" label="KYC documents" />
          <ToolLink href="/cod" label="COD deposit" />
          <ToolLink href="/shifts" label="Shifts" />
          <ToolLink href="/incentives" label="Incentives" />
          <ToolLink href="/referrals" label="Refer & earn" />
          <ToolLink href="/notifications" label="Notifications" />
          <ToolLink href="/fleet" label="Fleet route" />
          <ToolLink href="/training" label="Training" />
        </div>
      </Panel>

      <Panel title="Account & policies">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <ToolLink href="/account/security" label="Security" />
          <ToolLink href="/help" label="Help centre" />
          <ToolLink href="/payouts" label="Payout policy" />
          <ToolLink href="/faq" label="FAQ" />
          <ToolLink href="/agreement" label="Agreement" />
          <ToolLink href="/privacy" label="Privacy" />
        </div>
      </Panel>

      <button
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
        className="h-12 w-full rounded-xl border border-rider-border text-sm font-bold text-rider-text disabled:opacity-60"
      >
        {signOut.isPending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= Math.round(value) ? 'fill-rider-accent text-rider-accent' : 'text-rider-border'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}
