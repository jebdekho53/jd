'use client';

import { ProfileShell } from '@/features/profile/components/profile-shell';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { useRewardsQuery } from '@/features/profile/hooks/use-preferences';
import { Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIER_STYLES = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-slate-200 text-slate-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-violet-100 text-violet-800',
};

export function ProfileRewardsContent() {
  const { data: rewards, isLoading, isError, refetch } = useRewardsQuery();

  if (isLoading) {
    return (
      <ProfileShell title="Loyalty rewards">
        <ProfileListSkeleton rows={3} />
      </ProfileShell>
    );
  }

  if (isError || !rewards) {
    return (
      <ProfileShell title="Loyalty rewards">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  const progress = Math.min(100, (rewards.points / rewards.nextTierPoints) * 100);

  return (
    <ProfileShell title="Loyalty rewards" subtitle="Earn points on every order">
      <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 to-card p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-jd-text-muted">Your points</p>
            <p className="text-4xl font-bold text-jd-text-primary">{rewards.points}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Award className="h-6 w-6" aria-hidden />
          </div>
        </div>
        <span
          className={cn(
            'mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize',
            TIER_STYLES[rewards.tier as keyof typeof TIER_STYLES],
          )}
        >
          {rewards.tier} tier
        </span>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-jd-text-muted">
            <span>Progress to next tier</span>
            <span>{rewards.nextTierPoints - rewards.points} pts to go</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-3">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <section className="mt-6" aria-labelledby="history-heading">
        <h2 id="history-heading" className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          Reward history
        </h2>
        <ul className="space-y-2">
          {rewards.history.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-jd-text-primary">{entry.title}</p>
                <p className="text-xs text-jd-text-muted">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  entry.type === 'earned' ? 'text-green-600' : 'text-destructive',
                )}
              >
                {entry.type === 'earned' ? '+' : '-'}
                {entry.points}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </ProfileShell>
  );
}
