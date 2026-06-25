'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Gift } from 'lucide-react';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { useReferralQuery } from '@/features/profile/hooks/use-preferences';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { formatCurrency } from '@/lib/utils';

export function ProfileReferralsContent() {
  const { data: profile } = useProfileQuery();
  const { data: referral, isLoading, isError, refetch } = useReferralQuery(profile?.id ?? '');
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!referral?.code) return;
    await navigator.clipboard.writeText(referral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <ProfileShell title="Refer & earn">
        <ProfileListSkeleton rows={2} />
      </ProfileShell>
    );
  }

  if (isError || !referral) {
    return (
      <ProfileShell title="Refer & earn">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  const shareText = `Use my JebDekho code ${referral.code} for ₹100 off your first order!`;

  return (
    <ProfileShell title="Refer & earn" subtitle="Invite friends and earn rewards">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Gift className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-4 text-sm text-jd-text-muted">Your referral code</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-jd-text-primary">
          {referral.code}
        </p>
        <button
          type="button"
          onClick={copyCode}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-jd-text-primary">{referral.inviteCount}</p>
          <p className="text-xs text-jd-text-muted">Friends invited</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{formatCurrency(referral.earnings)}</p>
          <p className="text-xs text-jd-text-muted">Total earnings</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title: 'JebDekho', text: shareText });
          } else {
            copyCode();
          }
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 py-3 text-sm font-semibold text-jd-text-primary hover:bg-cream-3"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Invite friends
      </button>

      <p className="mt-4 text-center text-xs text-jd-text-muted">
        Earn ₹50 for each friend who places their first order. Terms apply.
      </p>
    </ProfileShell>
  );
}
