'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getEarnings,
  getMe,
  getPendingCod,
  getPushStatus,
  setStatus,
  type KycStatus,
  type RiderStatus,
} from '@/lib/api';
import { inr, pretty } from '@/lib/rider-format';
import { Metric } from '@/design-system/primitives';
import { useRiderGps } from './use-rider-gps';

/**
 * The sticky header and standing banners shared by the five captain tabs.
 *
 * It owns the online toggle and the GPS watcher, so location streaming survives
 * navigation between tabs — the tabs are separate routes now, and a watcher
 * living inside one of them would stop the moment a rider opened another.
 */
export function CaptainChrome({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const earnings = useQuery({ queryKey: ['rider', 'finance', 'earnings'], queryFn: getEarnings });
  const cod = useQuery({ queryKey: ['rider', 'finance', 'cod'], queryFn: getPendingCod });
  const push = useQuery({ queryKey: ['rider', 'push', 'status'], queryFn: getPushStatus });

  const profile = me.data?.profile;
  const approved = profile?.kycStatus === 'APPROVED';
  const online = profile ? profile.status !== 'OFFLINE' : false;
  const gps = useRiderGps({ online, approved });

  const statusMut = useMutation({
    mutationFn: (s: RiderStatus) => setStatus(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
  });

  const kycPending = profile?.kycStatus !== 'APPROVED';
  const codPending = Boolean(cod.data && cod.data.totalToDeposit > 0);

  return (
    <>
      <header className="sticky top-0 z-20 bg-rider-surface2 px-4 pb-4 pt-3 shadow-pop">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-rider-muted">JebDekho Rider</p>
            <p className="truncate text-lg font-bold">{profile?.name ?? me.data?.user.phone ?? '—'}</p>
          </div>
          <StatusToggle
            online={online}
            approved={approved}
            busy={statusMut.isPending}
            onToggle={() => statusMut.mutate(online ? 'OFFLINE' : 'ONLINE')}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Today" value={inr(earnings.data?.today ?? 0)} tone="onDark" />
          <Metric label="Orders" value={String(profile?.totalDeliveries ?? 0)} tone="onDark" />
          <Metric label="KYC" value={pretty(profile?.kycStatus ?? 'PENDING')} tone="onDark" />
        </div>
      </header>

      <section className="p-4">
        {kycPending && <KycBanner status={profile?.kycStatus ?? 'PENDING'} />}
        {codPending && (
          <Link
            href="/cod"
            className="mb-3 block rounded-xl border border-rider-accent/40 bg-rider-accent/10 p-3 text-left text-sm text-rider-text"
          >
            COD deposit pending: <b className="text-rider-accent">{inr(cod.data!.totalToDeposit)}</b> across{' '}
            {cod.data!.count} orders.
          </Link>
        )}
        {gps.message && (
          <div className="mb-3 rounded-xl border border-rider-info/40 bg-rider-info/10 p-3 text-sm text-rider-text">
            {gps.state === 'denied'
              ? 'Location permission denied. Enable GPS to receive live tracking.'
              : gps.message}
          </div>
        )}
        {/* Only nag once the rider is actually online and losing offers by it. */}
        {online && push.data?.configured && !push.data.subscribed && (
          <Link
            href="/notifications"
            className="mb-3 block rounded-xl border border-rider-info/40 bg-rider-info/10 p-3 text-sm text-rider-text"
          >
            Offer alerts are off. You will only see offers while this screen is open.
            <span className="mt-1 block text-xs text-rider-info">Turn on notifications →</span>
          </Link>
        )}
        {children}
      </section>
    </>
  );
}

function StatusToggle({
  online,
  approved,
  busy,
  onToggle,
}: {
  online: boolean;
  approved: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!approved || busy}
      className={`h-10 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${
        online ? 'bg-rider-online text-rider-bg' : 'bg-white/10 text-rider-muted'
      }`}
    >
      {online ? '● Online' : 'Offline'}
    </button>
  );
}

function KycBanner({ status }: { status: KycStatus }) {
  return (
    <Link
      href="/onboarding/status"
      className="mb-3 block rounded-xl border border-rider-accent/40 bg-rider-accent/10 p-3 text-sm text-rider-text"
    >
      KYC is <b className="text-rider-accent">{pretty(status)}</b>. You can receive deliveries after
      approval.
      <span className="mt-1 block text-xs text-rider-accent">Track my application →</span>
    </Link>
  );
}
