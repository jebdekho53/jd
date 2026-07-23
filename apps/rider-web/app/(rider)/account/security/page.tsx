'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, listLegalAcceptances, logout } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';

const DOC_LABELS: Record<string, string> = {
  RIDER_AGREEMENT: 'Delivery Partner Agreement',
  BUYER_TERMS: 'Buyer Terms',
};

export default function AccountSecurityPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const acceptances = useQuery({ queryKey: ['rider', 'legal', 'acceptances'], queryFn: listLegalAcceptances });

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.clear();
      router.replace('/login');
    },
  });

  return (
    <CaptainPageShell title="Security" subtitle="Sign-in, agreements, and account closure.">
      <Panel title="How you sign in">
        <p className="text-sm text-rider-text">{me.data?.user.phone ?? '—'}</p>
        <p className="mt-2 text-sm text-rider-muted">
          Your account has no password. Every sign-in is a one-time code sent to this number over
          WhatsApp, so anyone with access to it can sign in as you. If you lose the number or the
          SIM, raise a support ticket immediately.
        </p>
      </Panel>

      <Panel title="Agreements you have accepted">
        {acceptances.isLoading ? (
          <p className="text-sm text-rider-muted">Loading…</p>
        ) : acceptances.isError ? (
          <p className="text-sm text-rider-danger">Could not load your acceptance history.</p>
        ) : (acceptances.data ?? []).length === 0 ? (
          <p className="text-sm text-rider-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {(acceptances.data ?? []).map((item) => (
              <li key={`${item.code}-${item.version}-${item.acceptedAt}`} className="rounded-xl bg-white/5 p-3 text-sm">
                <b className="text-rider-text">{DOC_LABELS[item.code] ?? item.code}</b>
                <p className="text-xs text-rider-muted">
                  Version {item.version} · accepted {new Date(item.acceptedAt).toLocaleString('en-IN')}
                  {item.ipAddress ? ` · from ${item.ipAddress}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/agreement" className="mt-3 inline-block text-sm font-bold text-rider-accent">
          Read the current agreement
        </Link>
      </Panel>

      <Panel title="Close my account">
        <p className="text-sm text-rider-muted">
          Deleting your account is not instant and cannot be undone from the app. Settle any COD cash
          you are holding first — a deletion request cannot complete while you still hold
          JebDekho&apos;s money.
        </p>
        <Link href="/data-deletion" className="mt-3 inline-block text-sm font-bold text-rider-danger">
          How to request deletion
        </Link>
      </Panel>

      <button
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
        className="h-12 w-full rounded-xl border border-rider-border text-sm font-bold text-rider-text disabled:opacity-60"
      >
        {signOut.isPending ? 'Signing out…' : 'Sign out'}
      </button>
    </CaptainPageShell>
  );
}
