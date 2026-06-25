'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { fetchWallet } from '@/services/wallet/wallet-api';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Gift, Users, Award } from 'lucide-react';

export function WalletPageContent() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    staleTime: 30_000,
  });

  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">JebDekho Wallet</h1>
            <p className="mt-1 text-sm text-jd-text-muted">Balance, rewards and referrals</p>
          </div>

          {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-muted" />}

          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-6 shadow-card">
                  <div className="flex items-center gap-2 text-sm text-jd-text-muted">
                    <Wallet className="h-4 w-4" /> Wallet balance
                  </div>
                  <p className="mt-2 text-3xl font-bold">{formatCurrency(data.balance)}</p>
                  {data.expiringCreditsCount > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      {data.expiringCreditsCount} credit(s) expiring soon
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border bg-card p-6 shadow-card">
                  <div className="flex items-center gap-2 text-sm text-jd-text-muted">
                    <Award className="h-4 w-4" /> Reward points
                  </div>
                  <p className="mt-2 text-3xl font-bold">{data.rewardPoints}</p>
                  <p className="mt-1 text-xs capitalize text-jd-text-muted">{data.tier.toLowerCase()} tier</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/profile/rewards" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted">
                  <Gift className="h-4 w-4" /> Rewards history
                </Link>
                <Link href="/profile/referrals" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted">
                  <Users className="h-4 w-4" /> Referral code: {data.referralCode}
                </Link>
                <button type="button" onClick={() => refetch()} className="rounded-full border px-4 py-2 text-sm">
                  Refresh
                </button>
              </div>

              <section>
                <h2 className="mb-3 font-semibold">Recent transactions</h2>
                {data.transactions.length === 0 ? (
                  <p className="text-sm text-jd-text-muted">No wallet activity yet.</p>
                ) : (
                  <ul className="divide-y rounded-xl border">
                    {data.transactions.map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{tx.description ?? tx.type}</p>
                          <p className="text-xs text-jd-text-muted">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={tx.type === 'DEBIT' ? 'text-red-600' : 'text-green-700'}>
                          {tx.type === 'DEBIT' ? '-' : '+'}
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
