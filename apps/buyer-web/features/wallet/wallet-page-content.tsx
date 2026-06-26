'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Gift, RefreshCw, Users, Wallet, Award } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Chip } from '@/design-system/primitives';
import { fetchWallet } from '@/services/wallet/wallet-api';
import { formatCurrency, cn } from '@/lib/utils';

export function WalletPageContent() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    staleTime: 30_000,
  });

  return (
    <AuthGuard>
      <PageShell>
        <div className="mx-auto max-w-2xl space-y-5 lg:max-w-3xl">
          <div>
            <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Wallet</h1>
            <p className="mt-1 text-sm text-jd-text-muted">Balance, rewards & referrals</p>
          </div>

          {isLoading && (
            <div className="space-y-4">
              <div className="h-36 animate-pulse rounded-3xl bg-muted" />
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-jd-text-muted">Could not load wallet.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-semibold text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {data && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-card">
                  <div className="flex items-center gap-2 text-sm text-jd-text-muted">
                    <Wallet className="h-4 w-4 text-primary" aria-hidden />
                    Wallet balance
                  </div>
                  <p className="mt-2 text-3xl font-bold text-jd-text-primary">{formatCurrency(data.balance)}</p>
                  {data.expiringCreditsCount > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      {data.expiringCreditsCount} credit(s) expiring soon
                    </p>
                  )}
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-2 text-sm text-jd-text-muted">
                    <Award className="h-4 w-4 text-primary" aria-hidden />
                    Reward points
                  </div>
                  <p className="mt-2 text-3xl font-bold text-jd-text-primary">{data.rewardPoints}</p>
                  <p className="mt-1 text-xs capitalize text-jd-text-muted">{data.tier.toLowerCase()} tier</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/profile/rewards"
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-muted btn-press"
                >
                  <Gift className="h-3.5 w-3.5" aria-hidden />
                  Rewards history
                </Link>
                <Link
                  href="/profile/referrals"
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-muted btn-press"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  Refer & earn
                </Link>
                <Chip
                  size="sm"
                  leadingIcon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} aria-hidden />}
                  onClick={() => refetch()}
                >
                  Refresh
                </Chip>
              </div>

              {data.referralCode && (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-jd-text-muted">
                    Your referral code
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-primary">{data.referralCode}</p>
                </div>
              )}

              <section>
                <h2 className="mb-3 text-sm font-semibold text-jd-text-primary">Recent transactions</h2>
                {data.transactions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-jd-text-muted">
                    No wallet activity yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                    {data.transactions.map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-jd-text-primary">
                            {tx.description ?? tx.type}
                          </p>
                          <p className="text-xs text-jd-text-muted">
                            {new Date(tx.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 text-sm font-bold tabular-nums',
                            tx.type === 'DEBIT' ? 'text-destructive' : 'text-success',
                          )}
                        >
                          {tx.type === 'DEBIT' ? '−' : '+'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
