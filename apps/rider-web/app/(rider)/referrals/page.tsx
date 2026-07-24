'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Share2 } from 'lucide-react';
import { getMyReferrals } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { QueryList } from '@/design-system/primitives';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Signed up — awaiting first delivery',
  COMPLETED: 'Reward earned',
  REJECTED: 'Not eligible',
  FRAUD_FLAGGED: 'Under review',
};

export default function ReferralsPage() {
  const referrals = useQuery({ queryKey: ['rider', 'referrals'], queryFn: getMyReferrals });
  const [copied, setCopied] = useState(false);

  const code = referrals.data?.code;
  const shareText = code
    ? `Join JebDekho as a delivery partner using my code ${code} and we both earn a bonus after your first delivery!`
    : '';

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!code) return;
    if (navigator.share) {
      await navigator.share({ title: 'JebDekho Rider referral', text: shareText }).catch(() => {});
    } else {
      await copy();
    }
  };

  return (
    <CaptainPageShell title="Refer & earn" subtitle="Invite another rider and earn a bonus once they complete their first delivery.">
      <div className="rounded-3xl border border-rider-accent/40 bg-rider-accent/10 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-rider-muted">Your referral code</p>
        <p className="rider-num mt-2 text-3xl font-black tracking-[0.15em] text-rider-accent">
          {referrals.isLoading ? '…' : code ?? '—'}
        </p>
        {referrals.data && (
          <p className="mt-2 text-sm text-rider-muted">
            Earn <b className="text-rider-accent">₹{referrals.data.rewardPerReferral}</b> for every rider who joins
            with your code and completes their first delivery.
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={copy}
            disabled={!code}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-rider-border bg-rider-surface text-sm font-bold text-rider-text disabled:opacity-50"
          >
            <Copy className="h-4 w-4" aria-hidden /> {copied ? 'Copied!' : 'Copy code'}
          </button>
          <button
            onClick={share}
            disabled={!code}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-rider-accent text-sm font-bold text-rider-accent-foreground disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" aria-hidden /> Share
          </button>
        </div>
      </div>

      <Panel title="Total earned from referrals">
        <p className="rider-num text-3xl font-black text-rider-online">
          ₹{referrals.data?.totalEarned ?? 0}
        </p>
        <p className="mt-1 text-xs text-rider-muted">Credited automatically in your next weekly payout.</p>
      </Panel>

      <Panel title="Your referrals">
        <QueryList
          query={referrals.data ? { data: referrals.data.referrals, isLoading: false, isError: false } : referrals}
          empty="No one has used your code yet — share it to start earning."
          errorTitle="Could not load your referrals"
        >
          {(items) => (
            <ul className="space-y-2">
              {items.map((r, i) => (
                <li key={`${r.createdAt}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-rider-text">{STATUS_LABEL[r.status] ?? r.status}</p>
                    <p className="text-xs text-rider-muted">
                      Joined {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  {r.rewardAmount != null && (
                    <b className={r.status === 'COMPLETED' ? 'text-rider-online' : 'text-rider-muted'}>
                      ₹{r.rewardAmount}
                    </b>
                  )}
                </li>
              ))}
            </ul>
          )}
        </QueryList>
      </Panel>
    </CaptainPageShell>
  );
}
