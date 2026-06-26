'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Crown, Sparkles, Truck, BadgePercent } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Button, Spinner } from '@/design-system/primitives';
import { formatCurrency, cn } from '@/lib/utils';

async function fetchPlus(path: string, init?: RequestInit) {
  const res = await fetch(`/api/buyer/plus/${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

type PlusPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  benefits: Array<{ type: string }>;
};

const BENEFIT_ICONS: Record<string, typeof Truck> = {
  FREE_DELIVERY: Truck,
  EXCLUSIVE_DEALS: BadgePercent,
};

function benefitLabel(type: string) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function BuyerPlusContent() {
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useQuery({ queryKey: ['plus', 'plans'], queryFn: () => fetchPlus('plans') });
  const { data: me, isLoading: meLoading, refetch } = useQuery({
    queryKey: ['plus', 'me'],
    queryFn: () => fetchPlus('me'),
  });

  const isLoading = plansLoading || meLoading;
  const activePlanId = me?.subscription?.plan?.id;

  async function handleSubscribe(planId: string) {
    setSubscribingId(planId);
    try {
      await fetchPlus('subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      await refetch();
    } finally {
      setSubscribingId(null);
    }
  }

  return (
    <AuthGuard>
      <PageShell>
        <div className="mx-auto max-w-2xl space-y-6 lg:max-w-3xl">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                <Crown className="h-7 w-7" aria-hidden />
              </div>
              <div>
                <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">JebDekho Plus</h1>
                <p className="mt-1 text-sm text-jd-text-muted">
                  Free delivery, exclusive deals & member-only savings
                </p>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner label="Loading membership" />
            </div>
          )}

          {!isLoading && me?.subscription && (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-card">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" aria-hidden />
                Active membership
              </div>
              <p className="mt-2 font-medium text-jd-text-primary">{me.subscription.plan.name}</p>
              <p className="text-sm text-jd-text-muted">
                Renews {new Date(me.subscription.expiresAt).toLocaleDateString('en-IN')}
              </p>
              {me.savings?.savings != null && (
                <p className="mt-2 text-sm text-jd-text-secondary">
                  You&apos;ve saved{' '}
                  <span className="font-bold text-success">{formatCurrency(me.savings.savings)}</span>{' '}
                  so far
                </p>
              )}
            </div>
          )}

          {plansError && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-jd-text-muted">Could not load plans.</p>
              <button
                type="button"
                onClick={() => refetchPlans()}
                className="mt-3 text-sm font-semibold text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !plansError && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-jd-text-primary">Choose a plan</h2>
              {(plans ?? []).map((p: PlusPlan) => {
                const isActive = activePlanId === p.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'rounded-2xl border bg-card p-5 shadow-card transition',
                      isActive ? 'border-primary ring-1 ring-primary/20' : 'border-border',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-jd-text-primary">{p.name}</h3>
                        <p className="mt-1 text-sm text-jd-text-muted">
                          {formatCurrency(Number(p.monthlyPrice))}/mo ·{' '}
                          {formatCurrency(Number(p.yearlyPrice))}/yr
                        </p>
                      </div>
                      {isActive && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <ul className="mt-4 space-y-2">
                      {p.benefits.map((b) => {
                        const Icon = BENEFIT_ICONS[b.type] ?? Check;
                        return (
                          <li key={b.type} className="flex items-center gap-2 text-sm text-jd-text-secondary">
                            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                            {benefitLabel(b.type)}
                          </li>
                        );
                      })}
                    </ul>
                    <Button
                      type="button"
                      className="mt-5 w-full min-h-touch sm:w-auto"
                      disabled={isActive || subscribingId === p.id}
                      onClick={() => handleSubscribe(p.id)}
                    >
                      {subscribingId === p.id ? 'Subscribing…' : isActive ? 'Subscribed' : 'Subscribe'}
                    </Button>
                  </div>
                );
              })}
              {(plans ?? []).length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-jd-text-muted">
                  No membership plans available right now.
                </p>
              )}
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
